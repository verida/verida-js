// https://nodejs.org/api/assert.html
const assert = require('assert');
import { Utils } from '@verida/client-ts';
import Credentials from '../src/credentials';
import SharingCredential from '../src/sharing-credential';
import { base64Encoded, config, connect } from './config';


describe('Share Credential tests', function () {
    describe('Share Credential Units', function () {
        this.timeout(100000);
        let appContext;
        let shareCredential;
        let credential;
        let createdUri = ''

        beforeEach(async function () {
            appContext = await connect(config.PRIVATE_KEY_1);

            shareCredential = new SharingCredential(appContext);

            credential = new Credentials(appContext)
        });

        it('Issue an encrypted credential', async function () {
            const item = await credential.createCredentialJWT(config.SUBJECT_DID, config.CREDENTIAL_DATA);
            const data = await shareCredential.issueEncryptedPresentation(item);

            createdUri = data.veridaUri

            assert.ok(data.result.ok, 'Document was saved correctly');

            const expectedUri = Utils.buildVeridaUri(
                config.ISSUER_DID,
                config.VERIDA_CONTEXT_NAME,
                config.VERIDA_EXPECTED_DATABASE,
                data.result.id
            );

            const base64decodedURI = base64Encoded(data.veridaUri)

            const uriWithoutKey = base64decodedURI.substring(0, expectedUri.length);

            assert.equal(uriWithoutKey, expectedUri, 'URI is the expected value, without encryption key');

            // Fetch and decode the presentation
            const jwt = await Utils.fetchVeridaUri(base64decodedURI, appContext);
            const decodedPresentation = await credential.verifyPresentation(jwt)

            // Retreive the verifiable credential within the presentation
            const verifiableCredential = decodedPresentation.verifiablePresentation.verifiableCredential[0]

            assert.deepEqual(verifiableCredential.credentialSubject, config.CREDENTIAL_DATA, 'Decoded dredential data matches the original input');
        });
        it('Retrieve Credential data from URI using a different account', async function () {
            // BUT using config.PRIVATE_KEY_2

            const context = await connect(config.PRIVATE_KEY_2, 'Web credential scanner');

            const credential: any = new Credentials(context);

            const base64decodedURI = base64Encoded(createdUri)

            // Fetch and decode the presentation
            const jwt = await Utils.fetchVeridaUri(base64decodedURI, appContext);
            const decodedPresentation = await credential.verifyPresentation(jwt)

            // Retreive the verifiable credential within the presentation
            const verifiableCredential = decodedPresentation.verifiablePresentation.verifiableCredential[0]

            assert.deepEqual(verifiableCredential.credentialSubject, config.CREDENTIAL_DATA, 'Decoded dredential data matches the original input');
        });
        it('Attempt retrieval of invalid URI', async function () {
            const fetchVeridaUri = async () => {
                return await Utils.fetchVeridaUri(config.INVALID_VERIDA_URI, appContext);
            };
            assert.rejects(fetchVeridaUri);
        });

        it('Retrieve credential from an existing URI', async function () {
            createdUri = config.EXISTING_CREDENTIAL_URI

            // Fetch and decode the presentation
            const jwt = await Utils.fetchVeridaUri(createdUri, appContext)
            const decodedPresentation = await credential.verifyPresentation(jwt)

            // Retreive the verifiable credential within the presentation
            const verifiableCredential = decodedPresentation.verifiablePresentation.verifiableCredential[0]

            assert.deepEqual(verifiableCredential.credentialSubject, config.CREDENTIAL_DATA, 'Decoded dredential data matches the original input');
        });

        it('When Verida uri is issued directly from a data object', async function () {
            const data = await shareCredential.issueEncryptedPresentation(config.RAW_CREDENTIAL_DATA);

            createdUri = data.veridaUri

            const jwt = await Utils.fetchVeridaUri(createdUri, appContext);

            // Decode the credential
            const decodedCredential = await credential.verifyPresentation(jwt)

            // Obtain the payload, that contains the verifiable credential (.vc)
            const payload = decodedCredential.payload

            const vc = payload.vc

            assert.deepEqual(vc.credentialSubject, config.CREDENTIAL_DATA, 'Issuer matches expected DID');
        });
    });
});
