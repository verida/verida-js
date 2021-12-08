import * as _ from 'lodash';
import { Buffer } from 'buffer';
import { Context } from '@verida/client-ts';
import EncryptionUtils from '@verida/encryption-utils';
import Credentials from './credentials';
import { Issuer } from 'did-jwt-vc';

const { VUE_APP_CREDENTIAL_DB } = process.env;

/**
 *
 */

interface VCResult {
	item: any;
	result: any;
	did: string;
	uri: string;
}

export default class SharingCredential {
	context: Context;
	credentials: Credentials;
	issuer?: Issuer;

	constructor(context: Context) {
		this.context = context;
		this.credentials = new Credentials(context);
	}

	async issueEncryptedCredential(cred: any): Promise<any> {
		// Issue a new public, encrypted verida credential
		const account = await this.context.getAccount();
		const did = await account.did();
		const encryptionKey = new Uint8Array(EncryptionUtils.randomKey(22));
		const now = new Date();

		this.issuer = await this.credentials.createIssuer();

		const credential = {
			'@context': [
				'https://www.w3.org/2018/credentials/v1',
				'https://www.w3.org/2018/credentials/examples/v1',
			],
			id: '',
			type: ['VerifiableCredential'],
			issuer: did,
			issuanceDate: now.toISOString(),
			credentialSubject: {
				...cred,
			},
			credentialSchema: {
				id: cred['schema'],
				type: 'JsonSchemaValidator2018',
			},
		};

		const didJwtVc = await this.credentials.createVerifiableCredential(
			credential,
			this.issuer
		);

		const item = {
			didJwtVc: didJwtVc,
		};

		const contextName = this.context.getContextName();

		const result = (await this.issuePublicCredential(did, item, contextName, {
			key: encryptionKey,
		})) as VCResult;

		return result;
	}

	async issuePublicCredential(
		did: string,
		item: any,
		contextName: string,
		options: any
	): Promise<VCResult | unknown> {
		const defaults = {
			encrypt: true,
			key: EncryptionUtils.randomKey(32),
			permissions: {
				read: 'public',
				write: 'owner',
			},
		};

		options = _.merge(defaults, options);
		options = _.merge(
			{
				schema: options.encrypt
					? 'https://common.schemas.verida.io/credential/public/encrypted/v0.1.0/schema.json'
					: 'https://common.schemas.verida.io/credential/public/default/v0.1.0/schema.json',
			},
			options
		);

		const publicCredentials = await this.context.openDatastore(options.schema, {
			permissions: options.permissions,
		});

		delete item._rev;

		let params = {};

		if (options.encrypt) {
			const key = new Uint8Array(options.key);
			const content = EncryptionUtils.symEncrypt(item.didJwtVc, key);
			item = {
				content: content,
				schema: options.schema,
			};
			params = {
				key: options.key,
			};
		}

		try {
			const result = (await publicCredentials.save(item)) as any;

			return {
				item: item,
				result: result,
				did: did,
				uri: this.getCredentialUri(did, result.id, contextName, params),
			};
		} catch (err) {
			console.log(err);
		}
	}

	getCredentialUri(
		did: string,
		itemId: string,
		contextName: string,
		params: { key?: string }
	): string {
		let uri = `verida://${did}/${contextName}/${VUE_APP_CREDENTIAL_DB}/${itemId}`;
		if (params && params.key) {
			const encryptionKey = Buffer.from(params.key).toString('hex');
			uri += '?key=' + encryptionKey;
		}

		return uri;
	}
}
