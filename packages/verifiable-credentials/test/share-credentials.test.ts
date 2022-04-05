// https://nodejs.org/api/assert.html
const assert = require('assert');
import { EnvironmentType, Context, Utils } from '@verida/client-ts/src';
import Credentials from '../src/credentials';
import SharingCredential from '../src/sharing-credential';
import { config } from './config';


describe('Share Credential tests', function () {
    describe('Share Credential Units', function () {
        this.timeout(100000);
        let appContext: Context | any;
        let shareCredential: SharingCredential;
        let credential: Credentials;
        let createdUri = ''

        beforeEach(async function () {
            appContext = await Utils.connectAccount(config.PRIVATE_KEY_1, config.VERIDA_CONTEXT_NAME, EnvironmentType.TESTNET);

            shareCredential = new SharingCredential(appContext);

            credential = new Credentials()

            // `didJwtVc` data won't be in the  test credential data,so remove it from our test data before deepEqual executes
            delete config.CREDENTIAL_DATA['didJwtVc']
        });

        it('Issue an encrypted credential', async function () {

            const item = await credential.createCredentialJWT(config.SUBJECT_DID, config.CREDENTIAL_DATA, appContext);
            const data = await shareCredential.issueEncryptedPresentation(item);

            createdUri = data.veridaUri

            assert.ok(data.result.ok, 'Document was saved correctly');

            const expectedUri = Utils.buildVeridaUri(
                config.ISSUER_DID,
                config.VERIDA_CONTEXT_NAME,
                config.VERIDA_EXPECTED_DATABASE,
                data.result.id
            );

            const uriWithoutKey = data.veridaUri.substring(0, expectedUri.length);

            assert.equal(uriWithoutKey, expectedUri, 'URI is the expected value, without encryption key');

            // Fetch and decode the presentation
            const context = await Utils.getClientContext(createdUri, EnvironmentType.TESTNET)
            const jwt = await Utils.fetchVeridaUri(data.veridaUri, context);

            const decodedPresentation = await Credentials.verifyPresentation(jwt, EnvironmentType.TESTNET)

            // Retrieve the verifiable credential within the presentation
            const verifiableCredential = decodedPresentation.verifiablePresentation.verifiableCredential[0]

            delete config.CREDENTIAL_DATA['didJwtVc']

            assert.deepEqual(verifiableCredential.credentialSubject, config.CREDENTIAL_DATA, 'Decoded credential data matches the original input');
        });
        it('Retrieve Credential data from URI using a different account', async function () {
            // BUT using config.PRIVATE_KEY_2

            // Fetch and decode the presentation
            const context = await Utils.getClientContext(createdUri, EnvironmentType.TESTNET)
            const jwt = await Utils.fetchVeridaUri(createdUri, context);

            const decodedPresentation = await Credentials.verifyPresentation(jwt, EnvironmentType.TESTNET)

            // Retrieve the verifiable credential within the presentation

            const verifiableCredential = decodedPresentation.verifiablePresentation.verifiableCredential[0]

            assert.deepEqual(verifiableCredential.credentialSubject, config.CREDENTIAL_DATA, 'Decoded credential data matches the original input');
        });
        it('Attempt retrieval of invalid URI', async function () {
            const fetchVeridaUri = async () => {
                const context = await Utils.getClientContext(createdUri, EnvironmentType.TESTNET)
                return await Utils.fetchVeridaUri(config.INVALID_VERIDA_URI, context);
            };
            assert.rejects(fetchVeridaUri);
        });

        it('Retrieve credential from an existing URI', async function () {
            createdUri = config.EXISTING_CREDENTIAL_URI

            // Fetch and decode the presentation
            const context = await Utils.getClientContext(createdUri, EnvironmentType.TESTNET)
            const jwt = await Utils.fetchVeridaUri(createdUri, context);

            const decodedPresentation = await Credentials.verifyPresentation(jwt, EnvironmentType.TESTNET)

            // Retrieve the verifiable credential within the presentation

            const verifiableCredential = decodedPresentation.verifiablePresentation.verifiableCredential[0]

            assert.deepEqual(verifiableCredential.credentialSubject, config.CREDENTIAL_DATA, 'Decoded credential data matches the original input');
        });
        it('Attempt retrieval of invalid URI', async function () {
            const fetchVeridaUri = async () => {
                const context = await Utils.getClientContext(createdUri, EnvironmentType.TESTNET)
                return await Utils.fetchVeridaUri(config.INVALID_VERIDA_URI, context);
            };
            assert.rejects(fetchVeridaUri);
        });
        it('Retrieving credential from an existing data object with a DID JWT VC', async function () {
            const data = await shareCredential.issueEncryptedPresentation(config.RAW_CREDENTIAL_DATA);

            createdUri = data.veridaUri

            // Fetch and decode the presentation
            const context = await Utils.getClientContext(createdUri, EnvironmentType.TESTNET)
            const jwt = await Utils.fetchVeridaUri(createdUri, context);
            const decodedPresentation = await Credentials.verifyPresentation(jwt, EnvironmentType.TESTNET)

            // Retrieve the verifiable credential within the presentation
            const verifiableCredential = decodedPresentation.verifiablePresentation.verifiableCredential[0]

            assert.deepEqual(verifiableCredential.credentialSubject, config.CREDENTIAL_DATA, 'Decoded credential data matches the original input');
        });
    });
});
