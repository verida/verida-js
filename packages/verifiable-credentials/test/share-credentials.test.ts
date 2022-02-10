// https://nodejs.org/api/assert.html
const assert = require('assert');
import { Utils } from '@verida/client-ts';
import Credentials from '../src/credentials';
import SharingCredential from '../src/sharing-credential';
import { config, connect } from './config';


describe('Share Credential tests', function () {
    describe('Share Credential Units', function () {
        this.timeout(100000);

        it('Issue an encrypted credential', async function () {
            const context = await connect(config.PRIVATE_KEY_1);
            assert.equal(context.getContextName(), config.VERIDA_CONTEXT_NAME);

            const shareCredential = new SharingCredential(context);

            const credential = new Credentials(context);

            const item = await credential.createCredentialJWT(config.CREDENTAIL_DATA);

            const data = await shareCredential.issueEncryptedCredential(item);

            assert.ok(data.result.ok, 'Document was saved correctly');

            const expectedUri = Utils.buildVeridaUri(
                config.DID_1,
                config.VERIDA_CONTEXT_NAME,
                config.VERIDA_EXPECTED_DATABASE,
                data.result.id
            );

            const uriWithoutKey = data.uri.substring(0, expectedUri.length);
            assert.equal(uriWithoutKey, expectedUri, 'URI is the expected value');
        });
    });
});
