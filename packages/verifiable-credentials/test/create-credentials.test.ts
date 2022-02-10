// https://nodejs.org/api/assert.html
const assert = require('assert');
import { AutoAccount } from '@verida/account-node';
import { EnvironmentType, Network, Utils } from '@verida/client-ts';
import Credentials from '../src/credentials';
import SharingCredential from '../src/sharing-credential';

const WALLET = {
    mnemonic:
        'sunset dry result clarify six vote hero fiscal globe latin shop grief',
    privateKey:
        '0x5dd84b6d500bcbc018cbc71b0407d694095755d91af42bd3442b2dfc96b1e0af',
    publicKey:
        '0x5dd84b6d500bcbc018cbc71b0407d694095755d91af42bd3442b2dfc96b1e0af',
    did: 'did:vda:0xB3729982A2585544FD72c99CF3773a9c6baBD55c',
    address: '0xB3729982A2585544FD72c99CF3773a9c6baBD55c',
};

const credentialData = {
    id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
    alumniOf: 'Example University',
    schema:
        'https://common.schemas.verida.io/credential/public/default/v0.1.0/schema.json',
};

const VERIDA_CONTEXT_NAME = 'Verida: Credentials';
const VERIDA_TESTNET_DEFAULT_SERVER = 'https://db.testnet.verida.io:5002/';

//verida credential uri with an invalid document id
const VERIDA_URI =
    'verida://did:vda:0xB3729982A2585544FD72c99CF3773a9c6baBD55c/0x42406d644c8e884be0f76ee05539cfba03eda65baa2bda33ecd364ce4d18047c/credential_public_encrypted/6273bb80-596a-1331ec-ad0d-f3b4d6aec150?key=1f52db207c48b6c54f6692cb182c41bc3bd0805d0efdc9dcb25f15ade8639d5f';

const INVALID_VC_JWT = `eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL2V4YW1wbGVzL3YxIl0sImlkIjoiIiwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCJdLCJpc3N1ZXIiOiJkaWQ6dmRhOjB4QjM3Mjk5ODJBMjU4NTU0NEZENzJjOTlDRjM3NzNhOWM2YmFCRDU1YyIsImlzc3VhbmNlRGF0ZSI6IjIwMjItMDItMTBUMDc6MDg6MTQuMDQwWiIsImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmV4YW1wbGU6ZWJmZWIxZjcxMmViYzZmMWMyNzZlMTJlYzIxIiwiYWx1bW5pT2YiOiJFeGFtcGxlIFVuaXZlcnNpdHkiLCJzY2hlbWEiOiJodHRwczovL2NvbW1vbi5zY2hlbWFzLnZlcmlkYS5pby9jcmVkZW50aWFsL3B1YmxpYy9kZWZhdWx0L3YwLjEuMC9zY2hlbWEuanNvbiJ9LCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9jb21tb24uc2NoZW1hcy52ZXJpZGEuaW8vY3JlZGVudGlhbC9wdWJsaWMvZGVmYXVsdC92MC4xLjAvc2NoZW1hLmpzb24iLCJ0eXBlIjoiSnNvblNjaGVtYVZhbGlkYXRvcjIwMTgifX0sInN1YiI6ImRpZDp2ZGE6MHhCMzcyOTk4MkEyNTg1NTQ0RkQ3MmM5OUNGMzc3M2E5YzZiYUJENTVjIiwiaXNzIjoiZGlkOnZkYToweEIzNzI5OTgyQTI1ODU1NDRGRDcyYzk5Q0YzNzczYTljNmJhQkQ1NWMifQ.U2awX7ff-hPzUmMo4_VT0N-ORrQcGsnVTS5azw1iIH-6axMorvl30irBRCdWbn07TDM9ESFeFDLEXLguEXQ50w`;

const connect = async () => {
    const context = await Network.connect({
        context: {
            name: VERIDA_CONTEXT_NAME,
        },
        client: {
            environment: EnvironmentType.TESTNET,
        },
        account: new AutoAccount(
            {
                defaultDatabaseServer: {
                    type: 'VeridaDatabase',
                    endpointUri: VERIDA_TESTNET_DEFAULT_SERVER,
                },
                defaultMessageServer: {
                    type: 'VeridaMessage',
                    endpointUri: VERIDA_TESTNET_DEFAULT_SERVER,
                },
            },
            {
                privateKey: WALLET.privateKey,
                environment: EnvironmentType.TESTNET,
            }
        ),
    });
    return context;
};

describe('Credential tests', function () {
    describe('Credential Units', function () {
        this.timeout(100000);

        it('Login in user and create  app context', async function () {
            const context = await connect();
            assert.equal(context.getContextName(), VERIDA_CONTEXT_NAME);
        });
        it('Verify Credential JWT was created correctly', async function () {
            const context = await connect();

            const credential = new Credentials(context);

            const item: any = await credential.createCredentialJWT(credentialData);

            const testJwt = {
                didJwtVc: item.didJwtVc
            }

            assert.deepEqual(item, testJwt, 'Expected credential didJWT was generated');
        });
        it('Verify a JWT signature is valid', async function () {
            const context = await connect();

            const shareCredential = new SharingCredential(context);
            const credential = new Credentials(context);

            const item = await credential.createCredentialJWT(credentialData);

            const data = await shareCredential.issueEncryptedCredential(item);

            const jwt = await Utils.fetchVeridaUri(data.uri, context);

            const verifiedCredential: any = await credential.verifyCredential(jwt);

            assert.equal(verifiedCredential.jwt, jwt, 'JWT signature is valid');
        });

        it('When  a JWT signature is invalid', async function () {
            const context = await connect();

            const shareCredential = new SharingCredential(context);
            const credential = new Credentials(context);

            const item = await credential.createCredentialJWT(credentialData);

            const data = await shareCredential.issueEncryptedCredential(item);

            const jwt = await Utils.fetchVeridaUri(data.uri, context);

            const verifiedCredential: any = await credential.verifyCredential(jwt);

            assert.notEqual(verifiedCredential.jwt, INVALID_VC_JWT, 'JWT signature is invalid');
        });

        it('When Verida uri data does not exist in the database', async function () {
            const context = await connect();

            const fetchVeridaUri = async () => {
                return await Utils.fetchVeridaUri(VERIDA_URI, context);
            };

            assert.rejects(fetchVeridaUri);
        });
    });
});
