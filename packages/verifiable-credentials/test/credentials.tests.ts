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
const VERIDA_EXPECTED_DATABASE = 'credential_public_encrypted';

//verida credential uri with an invalid document id
const VERIDA_URI =
	'verida://did:vda:0xB3729982A2585544FD72c99CF3773a9c6baBD55c/0x42406d644c8e884be0f76ee05539cfba03eda65baa2bda33ecd364ce4d18047c/credential_public_encrypted/6273bb80-596a-1331ec-ad0d-f3b4d6aec150?key=1f52db207c48b6c54f6692cb182c41bc3bd0805d0efdc9dcb25f15ade8639d5f';

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
		let encryptedData;

		it('Login in user and create context', async function () {
			const context = await connect();
			assert.equal(context.getContextName(), VERIDA_CONTEXT_NAME);
		});
		it('Issue encrypted credential', async function () {
			const context = await connect();

			const shareCredential = new SharingCredential(context);
			const credential = new Credentials(context);

			const item = await credential.createCredentialJWT(credentialData);

			const data = await shareCredential.issueEncryptedCredential(item);

			encryptedData = data;
			assert.ok(data.result.ok, 'Document was saved correctly');

			const expectedUri = Utils.buildVeridaUri(
				WALLET.did,
				VERIDA_CONTEXT_NAME,
				VERIDA_EXPECTED_DATABASE,
				data.result.id
			);

			const uriWithoutKey = data.uri.substring(0, expectedUri.length);
			assert.equal(uriWithoutKey, expectedUri, 'URI is the expected value');
		});
		it('Verify a credential', async function () {
			const context = await connect();

			const credential = new Credentials(context);

			const jwt = await Utils.fetchVeridaUri(encryptedData.uri, context);

			const verifiedCredential: any = await credential.verifyCredential(jwt);

			assert.equal(verifiedCredential.jwt, jwt, 'JWT does not match');
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
