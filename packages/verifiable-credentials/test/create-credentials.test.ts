// https://nodejs.org/api/assert.html
const assert = require('assert');

import Credentials from '../src/credentials';
import { config, connect } from './config'
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)



describe('Credential tests', function () {

    describe('Credential Units', function () {
        this.timeout(100000);
        let appContext;
        let credentialSdk;

        beforeEach(async function () {
            appContext = await connect(config.PRIVATE_KEY_1);
            credentialSdk = new Credentials();
        });
        it('Verify Credential JWT was created correctly', async function () {

            const credential: any = await credentialSdk.createCredentialJWT(config.SUBJECT_DID, config.CREDENTIAL_DATA_PAYLOAD);

            // Decode the credentialSdk
            const decodedCredential = await credentialSdk.verifyCredential(credential.didJwtVc)

            // Obtain the payload, that contains the verifiable credentialSdk (.vc)
            const payload = decodedCredential.payload
            const vc = payload.vc

            // Verify the "Payload"
            const issuer = await credentialSdk.createIssuer();
            assert.equal(payload.iss, issuer.did, 'Credential issuer matches expected DID')

            // Verify the data matches the schema
            const record = vc.credentialSubject
            const schema = await appContext.getClient().getSchema(record.schema)
            const isValid = await schema.validate(config.CREDENTIAL_DATA_PAYLOAD);
            assert.equal(true, isValid, 'Credential subject successfully validates against the schema');

            // Verify the "Verifiable Credential"
            delete config.CREDENTIAL_DATA_PAYLOAD['didJwtVc']

            assert.deepEqual(vc.credentialSubject, config.CREDENTIAL_DATA_PAYLOAD, 'Credential data is valid');
            assert.deepEqual(issuer.did, vc.issuer, 'Issuer matches expected DID');
            assert.equal(vc.credentialSchema.id, config.CREDENTIAL_DATA_PAYLOAD.schema, 'Credential schema is correct')
            assert.equal(vc.sub, config.SUBJECT_DID, 'Credential subject matches expected DID')
        });
        it('Check the schema is a credential schema type', async function () {
            const credential: any = await credentialSdk.createCredentialJWT(config.SUBJECT_DID, config.CREDENTIAL_DATA_PAYLOAD);

            // Decode the credentialSdk
            const decodedCredential = await credentialSdk.verifyCredential(credential.didJwtVc)

            // Obtain the payload, that contains the verifiable credentialSdk (.vc)
            const payload = decodedCredential.payload
            const vc = payload.vc

            // Verify the data matches the schema
            const record = vc.credentialSubject
            const schema = await appContext.getClient().getSchema(record.schema)
            const schemaJson = await schema.getSpecification();
            assert.ok(schemaJson.properties.didJwtVc, 'schemaJson has the didJwtVc attribute');
        });
        it('Unable to create credential with invalid schema data', async function () {
            const promise = new Promise((resolve, rejects) => {
                credentialSdk.createCredentialJWT(config.SUBJECT_DID, config.INVALID_CREDENTIAL_DATA).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error('Data does not match specified schema'))
        });
        it('Unable to create credential if no schema specified', async function () {
            const promise = new Promise((resolve, rejects) => {
                credentialSdk.createCredentialJWT(config.SUBJECT_DID, {}).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error('No schema specified'))
        });
        it('Ensure expired expiration date is respected', async () => {
            // Set an expiry date to the past
            const expirationDate = '2000-02-14T04:27:05.467Z'
            const credential: any = await credentialSdk.createCredentialJWT(config.SUBJECT_DID, config.CREDENTIAL_DATA, { expirationDate });

            const decodedCredential = await credentialSdk.verifyCredential(credential.didJwtVc)
            assert.equal(decodedCredential, false, 'Credential is not valid')
            assert.deepEqual(credentialSdk.getErrors(), ['Credential has expired'], 'Credential has expected error message')
        });
        it('Ensure issuanceDate generated in VC is same in the date options', async () => {
            const issuanceDate = '2022-02-14T04:27:05.467Z';

            const credential: any = await credentialSdk.createCredentialJWT(config.SUBJECT_DID, config.CREDENTIAL_DATA, { issuanceDate });

            const decodedCredential = await credentialSdk.verifyCredential(credential.didJwtVc)

            const payload = decodedCredential.payload
            const vc = payload.vc

            //format date to UTC
            const formattedIssuanceDate = dayjs(issuanceDate).utc(true).format()
            const formattedIssuanceVCDate = dayjs(vc.issuanceDate).utc().format()

            assert.deepEqual(formattedIssuanceVCDate, formattedIssuanceDate, 'issuanceDate options matches generated VC date ');
        });
        it('Ensure issuanceDate generated in VC is within 10secs', async () => {
            const credential: any = await credentialSdk.createCredentialJWT(config.SUBJECT_DID, config.CREDENTIAL_DATA);
            const decodedCredential = await credentialSdk.verifyCredential(credential.didJwtVc)
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
            const credential: any = await credentialSdk.createCredentialJWT(config.SUBJECT_DID, config.CREDENTIAL_DATA, { expirationDate, issuanceDate });

            await credentialSdk.verifyCredential(credential.didJwtVc, currentDateTime);

            assert.deepEqual(credentialSdk.getErrors(), ['Credential has expired'], 'currentDateTime is less than expiration date');
        });
        it('Ensure valid expiration date is respected', async () => {
            // Set an expiry date to the future
            const expirationDate = '2060-02-14T04:27:05.467Z'

            const credential: any = await credentialSdk.createCredentialJWT(config.SUBJECT_DID, config.CREDENTIAL_DATA, {
                expirationDate
            });

            const decodedCredential = await credentialSdk.verifyCredential(credential.didJwtVc)
            assert.ok(decodedCredential, 'Credential is valid')
        });
    });
});
