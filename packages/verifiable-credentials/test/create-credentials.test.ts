// https://nodejs.org/api/assert.html
const assert = require('assert');
import { Utils } from '@verida/client-ts';
import Credentials from '../src/credentials';
import SharingCredential from '../src/sharing-credential';
import { config, connect } from './config'


describe('Credential tests', function () {
    describe('Credential Units', function () {
        this.timeout(100000);
        let encryptedData;

        
        let appContext;
        let shareCredential;
        let credential;

        it('Login in user and create  app context', async function () {
            appContext = await connect(config.PRIVATE_KEY_1);
            assert.equal(appContext.getContextName(), config.VERIDA_CONTEXT_NAME);
            shareCredential = new SharingCredential(appContext);
            credential = new Credentials(appContext);
        });
        it('Verify Credential JWT was created correctly', async function () {

            const item: any = await credential.createCredentialJWT(config.CREDENTAIL_DATA);

            const testJwt = {
                didJwtVc: item.didJwtVc
            }

            assert.deepEqual(item, testJwt, 'Expected credential didJWT was generated');
        });
        it('Verify a JWT signature is valid', async function () {

            const item = await credential.createCredentialJWT(config.CREDENTAIL_DATA);

            const data = await shareCredential.issueEncryptedCredential(item);

            encryptedData = data

            const jwt = await Utils.fetchVeridaUri(data.uri, appContext);

            const verifiedCredential: any = await credential.verifyCredential(jwt);

            assert.equal(verifiedCredential.jwt, jwt, 'JWT signature is valid');
        });

        it('Retrieve Credential data from URI using a different account', async function () {
            const context = await connect(config.PRIVATE_KEY_2);

            const credential = new Credentials(context);

            const jwt = await Utils.fetchVeridaUri(encryptedData.uri, context);


            const verifiedCredential: any = await credential.verifyCredential(jwt);

            assert.equal(verifiedCredential.jwt, jwt, 'JWT signature is valid');
        });

        it('When  a JWT signature is invalid', async function () {

            const item = await credential.createCredentialJWT(config.CREDENTAIL_DATA);

            const data = await shareCredential.issueEncryptedCredential(item);

            const jwt = await Utils.fetchVeridaUri(data.uri, appContext);

            const verifiedCredential: any = await credential.verifyCredential(jwt);

            assert.notEqual(verifiedCredential.jwt, config.INVALID_VC_JWT, 'JWT signature is invalid');
        });

        it('When Verida uri data does not exist in the database', async function () {

            const fetchVeridaUri = async () => {
                return await Utils.fetchVeridaUri(config.VERIDA_URI, appContext);
            };

            assert.rejects(fetchVeridaUri);
        });
    });
});
