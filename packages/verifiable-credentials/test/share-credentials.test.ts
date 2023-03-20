const assert = require('assert');
require('dotenv').config();
import { getClientContext, connectAccount } from './utils';
import Credentials from '../src/credentials';
import SharingCredential from '../src/sharing-credential';
import config from './config';
import { EnvironmentType, IContext } from '@verida/types';
import { buildVeridaUri, fetchVeridaUri } from '@verida/helpers';
import { Network } from '@verida/client-ts';

describe('Share Credential tests', function () {
    describe('Share Credential Units', function () {
        this.timeout(100000);
        let appContext: IContext;
        let issuerDid: string
        let shareCredential: SharingCredential;
        let credential: Credentials;
        let createdUri = ''

        before(async function () {
            appContext = await connectAccount(config.VDA_PRIVATE_KEY_1, config.VERIDA_CONTEXT_NAME, EnvironmentType.TESTNET);
            shareCredential = new SharingCredential(appContext);
            credential = new Credentials()
            issuerDid = await appContext.getAccount().did()

            // `didJwtVc` data won't be in the  test credential data,so remove it from our test data before deepEqual executes
            delete config.CREDENTIAL_DATA['didJwtVc']
        });

        it('Issue an encrypted credential', async function () {
            const didJwtVc = await credential.createCredentialJWT({
                schema: config.SCHEMA_SBT,
                subjectId: config.SUBJECT_DID,
                data: config.CREDENTIAL_DATA,
                context: appContext
            })

            const data = await shareCredential.issueEncryptedPresentation(didJwtVc)
            createdUri = data.veridaUri
            assert.ok(data.result.ok, 'Document was saved correctly');

            const expectedUri = buildVeridaUri(
                issuerDid,
                config.VERIDA_CONTEXT_NAME,
                config.VERIDA_EXPECTED_DATABASE,
                data.result.id
            );

            const uriWithoutKey = data.veridaUri.substring(0, expectedUri.length);

            assert.equal(uriWithoutKey, expectedUri, 'URI is the expected value, without encryption key');

            // Fetch and decode the presentation
            const fetchedDidJwtVc = await Network.getRecord(createdUri)

            const decodedPresentation = await Credentials.verifyPresentation(fetchedDidJwtVc, {
                rpcUrl: config.DID_CLIENT_CONFIG.rpcUrl
            })

            // Retrieve the verifiable credential within the presentation
            const vc = decodedPresentation.verifiablePresentation.verifiableCredential[0]

            assert.deepEqual(vc.credentialSubject, config.CREDENTIAL_DATA, 'Decoded credential data matches the original input');
        });
        it('Retrieve Credential data from URI using a different account', async function () {
            // BUT using config.PRIVATE_KEY_2

            // Fetch and decode the presentation
            const fetchedDidJwtVc = await Network.getRecord(createdUri)

            const decodedPresentation = await Credentials.verifyPresentation(fetchedDidJwtVc, {
                rpcUrl: config.DID_CLIENT_CONFIG.rpcUrl
            })

            // Retrieve the verifiable credential within the presentation

            const verifiableCredential = decodedPresentation.verifiablePresentation.verifiableCredential[0]

            assert.deepEqual(verifiableCredential.credentialSubject, config.CREDENTIAL_DATA, 'Decoded credential data matches the original input');
        });

        it('Attempt retrieval of invalid URI', async function () {
            const fetchVeridaUri = async () => {
                return await Network.getRecord(createdUri)
            };
            assert.rejects(fetchVeridaUri);
        });
        it('Attempt retrieval of invalid URI', async function () {
            const fetchVeridaUri = async () => {
                return await Network.getRecord(config.INVALID_VERIDA_URI)
            };
            assert.rejects(fetchVeridaUri);
        });
        it('Retrieving credential from an existing data object with a DID JWT VC', async function () {
            const data = await shareCredential.issueEncryptedPresentation(config.RAW_CREDENTIAL_DATA.didJwtVc);

            createdUri = data.veridaUri

            // Fetch and decode the presentation
            const fetchedDidJwtVc = await Network.getRecord(createdUri)
            const decodedPresentation = await Credentials.verifyPresentation(fetchedDidJwtVc, {
                rpcUrl: config.DID_CLIENT_CONFIG.rpcUrl
            })

            // Retrieve the verifiable credential within the presentation
            const verifiableCredential = decodedPresentation.verifiablePresentation.verifiableCredential[0]

            assert.deepEqual(verifiableCredential.credentialSubject, config.CREDENTIAL_DATA, 'Decoded credential data matches the original input');
        });

        this.afterAll(async () => {
            await appContext.close()
        })
    });
});
