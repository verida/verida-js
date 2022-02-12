// https://nodejs.org/api/assert.html
const assert = require('assert');
import { Utils } from '@verida/client-ts';
import Credentials from '../src/credentials';
import SharingCredential from '../src/sharing-credential';
import { config, connect } from './config'


describe('Credential tests', function () {

    describe('Credential Units', function () {
        this.timeout(100000);
        let appContext;
        let shareCredential;
        let credential;

        beforeEach(async function () {
            appContext = await connect(config.PRIVATE_KEY_1);

            shareCredential = new SharingCredential(appContext);

            credential = new Credentials(appContext)
        });

        it('Verify Credential JWT was created correctly', async function () {

            const jwt: any = await credential.createCredentialJWT(config.CREDENTIAL_DATA);

            const issuer = await credential.createIssuer();

            const credentials = await credential.verifyCredential(jwt.didJwtVc)

            delete credentials.verifiableCredential.credentialSubject.id


            assert.deepEqual(credentials.verifiableCredential.credentialSubject, config.CREDENTIAL_DATA, 'Credential data is not valid');

            assert.deepEqual(issuer.did, credentials.payload.vc.issuer, 'Issuer is not verified');

            assert.deepEqual(jwt.didJwtVc, credentials.jwt, 'Expected credential didJWT was generated');
        });
        it('Verify if credential data schema is valid', async function () {
            const schemas = await appContext.getClient().getSchema(config.CREDENTIAL_DATA.schema)
            const isValid = await schemas.validate(config.CREDENTIAL_DATA);

            assert.equal(true, isValid, 'credential data schema is inValid');
        });

        it('Verify a JWT signature is valid', async function () {

            const item = await credential.createCredentialJWT(config.CREDENTIAL_DATA);

            const data = await shareCredential.issueEncryptedCredential(item);

            const jwt = await Utils.fetchVeridaUri(data.uri, appContext);

            const verifiedCredential: any = await credential.verifyCredential(jwt);



            assert.equal(verifiedCredential.jwt, jwt, 'JWT signature is valid');
        });
    });
});
