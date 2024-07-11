const assert = require('assert');
require('dotenv').config();
import Credentials from '../src/credentials';
import { VeridaCredentialRecord } from '../src/interfaces';
import config from './config';
import { connectAccount } from './utils';
import { Network } from '@verida/types';
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc)

describe('Credential tests', function () {

    describe('Credential Units', function () {
        this.timeout(100000);
        let appContext;
        let credentialSdk: Credentials;

        before(async function () {
            appContext = await connectAccount(config.VDA_PRIVATE_KEY_1, config.VERIDA_CONTEXT_NAME, Network.BANKSIA);
            credentialSdk = new Credentials();
        });

        it.only('Verify Credential JWT was created correctly', async function () {
            const didJwtVc: any = await credentialSdk.createCredentialJWT({
                subjectId: config.SUBJECT_DID,
                schema: config.SCHEMA_SBT,
                data: config.CREDENTIAL_DATA,
                context: appContext
            });

            // Decode the credentialSdk
            const decodedCredential = await credentialSdk.verifyCredential(didJwtVc, {
                rpcUrl: config.DID_CLIENT_CONFIG.rpcUrl
            })

            // Obtain the payload, that contains the verifiable credentialSdk (.vc)
            console.log(decodedCredential)
            const payload = decodedCredential.payload
            const vc = payload.vc

            // Verify the "Payload"
            const issuer = await credentialSdk.createIssuer(appContext);
            assert.equal(payload.iss, issuer.did, 'Credential issuer matches expected DID')

            // Verify the data matches the schema
            const schema = await appContext.getClient().getSchema(vc.credentialSchema.id)
            const isValid = await schema.validate(config.CREDENTIAL_DATA)
            assert.equal(true, isValid, 'Credential subject successfully validates against the schema');

            assert.ok(decodedCredential.verifiableCredential.proof, 'Credential has a proof')
            assert.deepEqual(decodedCredential.verifiableCredential.credentialSubject, config.CREDENTIAL_DATA, 'Credential data is valid');
            assert.deepEqual(issuer.did, vc.issuer, 'Issuer matches expected DID');
            assert.equal(vc.credentialSchema.id, config.SCHEMA_SBT, 'Credential schema is correct')
            assert.equal(vc.sub, config.SUBJECT_DID, 'Credential subject matches expected DID')
            
        });
        it('Verify createVerifiableCredentialRecord generates a proof', async function() {
            const data: VeridaCredentialRecord = await credentialSdk.createVerifiableCredentialRecord({
                subjectId: config.SUBJECT_DID,
                schema: config.SCHEMA_SBT,
                data: config.CREDENTIAL_DATA,
                context: appContext
            }, 'Test');

            assert.ok(data.credentialData.proof, 'Credential data has a proof')
        });
        it('Unable to create credential with invalid schema data', async function () {
            const promise = new Promise((resolve, rejects) => {
                credentialSdk.createCredentialJWT({
                    subjectId: config.SUBJECT_DID,
                schema: config.SCHEMA_SBT,
                data: config.INVALID_CREDENTIAL_DATA,
                context: appContext
                }).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error('Data does not match specified schema'))
        });
        it('Unable to create credential if no schema specified', async function () {
            const promise = new Promise((resolve, rejects) => {
                credentialSdk.createCredentialJWT({
                    subjectId: config.SUBJECT_DID,
                    schema: '',
                    data: {},
                    context: appContext
                }).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error('No schema specified'))
        });
        it('Ensure expired expiration date is respected', async () => {
            // Set an expiry date to the past
            const expirationDate = '2000-02-14T04:27:05.467Z'
            const didJwtVc: any = await credentialSdk.createCredentialJWT({
                subjectId: config.SUBJECT_DID,
                schema: config.SCHEMA_SBT,
                data: config.CREDENTIAL_DATA,
                context: appContext,
                options: { expirationDate }
            });

            const decodedCredential = await credentialSdk.verifyCredential(didJwtVc, {
                rpcUrl: config.DID_CLIENT_CONFIG.rpcUrl
            })
            assert.equal(decodedCredential, false, 'Credential is not valid')
            assert.deepEqual(credentialSdk.getErrors(), ['Credential has expired'], 'Credential has expected error message')
        });
        it('Ensure issuanceDate generated in VC is same in the date options', async () => {
            const issuanceDate = '2022-02-14T04:27:05.467Z';

            const didJwtVc: any = await credentialSdk.createCredentialJWT({
                subjectId: config.SUBJECT_DID,
                schema: config.SCHEMA_SBT,
                data: config.CREDENTIAL_DATA,
                context: appContext,
                options: { issuanceDate }
            });

            const decodedCredential = await credentialSdk.verifyCredential(didJwtVc, {
                rpcUrl: config.DID_CLIENT_CONFIG.rpcUrl
            })

            const payload = decodedCredential.payload
            const vc = payload.vc

            //format date to UTC
            const formattedIssuanceDate = dayjs(issuanceDate).utc(true).format()
            const formattedIssuanceVCDate = dayjs(vc.issuanceDate).utc().format()

            assert.deepEqual(formattedIssuanceVCDate, formattedIssuanceDate, 'issuanceDate options matches generated VC date ');
        });
        it('Ensure issuanceDate generated in VC is within 10secs', async () => {
            const didJwtVc: any = await credentialSdk.createCredentialJWT({
                subjectId: config.SUBJECT_DID,
                schema: config.SCHEMA_SBT,
                data: config.CREDENTIAL_DATA,
                context: appContext
            });

            const decodedCredential = await credentialSdk.verifyCredential(didJwtVc, {
                rpcUrl: config.DID_CLIENT_CONFIG.rpcUrl
            })
            const payload = decodedCredential.payload
            const vc = payload.vc

            const currentTime = dayjs(new Date().toISOString()).utc(true).second();
            const createdVcTime = dayjs(vc.issuanceDate).utc(true).second()

            const issuanceDate = currentTime - createdVcTime;

            assert.ok(issuanceDate < 10, 'issuanceDate is within 10secs after creating ');
        });
        it('Ensure credential is verified using external currentDateTime', async () => {
            // Set an expiry date to the pastÛ
            const expirationDate = '2000-02-14T04:27:05.467Z';
            const issuanceDate = '2022-02-14T04:27:05.467Z';
            const currentDateTime = '2024-02-14T04:27:05.467Z';
            const didJwtVc: any = await credentialSdk.createCredentialJWT({
                subjectId: config.SUBJECT_DID,
                schema: config.SCHEMA_SBT,
                data: config.CREDENTIAL_DATA,
                context: appContext,
                options: { issuanceDate, expirationDate }
            });

            await credentialSdk.verifyCredential(didJwtVc, {
                rpcUrl: config.DID_CLIENT_CONFIG.rpcUrl
            }, currentDateTime);

            assert.deepEqual(credentialSdk.getErrors(), ['Credential has expired'], 'currentDateTime is less than expiration date');
        });
        it('Ensure valid expiration date is respected', async () => {
            // Set an expiry date to the future
            const expirationDate = '2060-02-14T04:27:05.467Z'
            const didJwtVc: any = await credentialSdk.createCredentialJWT({
                subjectId: config.SUBJECT_DID,
                schema: config.SCHEMA_SBT,
                data: config.CREDENTIAL_DATA,
                context: appContext,
                options: {
                    expirationDate
                }
            });

            const decodedCredential = await credentialSdk.verifyCredential(didJwtVc, {
                rpcUrl: config.DID_CLIENT_CONFIG.rpcUrl
            })
            assert.ok(decodedCredential, 'Credential is valid')
        });

        this.afterAll(async () => {
            await appContext.close()
        })
    });
});
