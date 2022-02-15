// https://nodejs.org/api/assert.html
const assert = require('assert');
import { Utils } from '@verida/client-ts';
import Credentials from '../src/credentials';
import SharingCredential from '../src/sharing-credential';
import { config, connect } from './config';


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

            const data = await shareCredential.issueEncryptedCredential(item);

            createdUri = data.uri

            assert.ok(data.result.ok, 'Document was saved correctly');

            const expectedUri = Utils.buildVeridaUri(
                config.ISSUER_DID,
                config.VERIDA_CONTEXT_NAME,
                config.VERIDA_EXPECTED_DATABASE,
                data.result.id
            );

            const uriWithoutKey = data.uri.substring(0, expectedUri.length);

            assert.equal(uriWithoutKey, expectedUri, 'URI is the expected value, without encryption key');

            const jwt = await Utils.fetchVeridaUri(createdUri, appContext);

            // Decode the credential
            const decodedCredential = await credential.verifyCredential(jwt)

            // Obtain the payload, that contains the verifiable credential (.vc)
            const payload = decodedCredential.payload

            const vc = payload.vc

            assert.deepEqual(vc.credentialSubject, config.CREDENTIAL_DATA, 'Issuer matches expected DID');
        });
        it('Retrieve Credential data from URI using a different account', async function () {
            // BUT using config.PRIVATE_KEY_2

            const context = await connect(config.PRIVATE_KEY_2, 'Web credential scanner');

            const credentialHelper = new Credentials(context);

            const jwt = await Utils.fetchVeridaUri(createdUri, context);

            const decodedCredential: any = await credentialHelper.verifyCredential(jwt);

            const payload = decodedCredential.payload

            const vc = payload.vc

            assert.deepEqual(vc.credentialSubject, config.CREDENTIAL_DATA, 'decoded Credential subject matches original data');
        });
        it('When Verida uri data does not exist in the database', async function () {

            const fetchVeridaUri = async () => {
                return await Utils.fetchVeridaUri(config.INVALID_VERIDA_URI, appContext);
            };
            assert.rejects(fetchVeridaUri);
        });
    });
});
