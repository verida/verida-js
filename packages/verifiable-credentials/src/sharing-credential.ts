import * as _ from 'lodash';
import EncryptionUtils from '@verida/encryption-utils';
import { VCResult } from './interfaces';
import { Credentials } from '.';
import { IContext, DatabasePermissionOptionsEnum } from '@verida/types';
import { buildVeridaUri, encodeUri } from '@verida/helpers'
import { CreatePresentationOptions } from 'did-jwt-vc';

const PermissionOptionsEnum = DatabasePermissionOptionsEnum


const SCHEMAs = {
	encrypted:
		'https://common.schemas.verida.io/credential/public/encrypted/v0.1.0/schema.json',
	default:
		'https://common.schemas.verida.io/credential/public/default/v0.1.0/schema.json',
};

export default class SharingCredential {
	context: IContext;

	constructor(context: IContext) {
		this.context = context;
	}
	/**
	 * Method to encrypt and issue credential
	 * @param didJwtVc
	 * @param options
	 * @returns
	 */

	async issueEncryptedPresentation(didJwtVc: any, options?: CreatePresentationOptions): Promise<any> {
		const account = this.context.getAccount();
		const did = await account.did();
		const encryptionKey = new Uint8Array(EncryptionUtils.randomKey(22));

		const contextName = this.context.getContextName();

		const result = (await this.issuePublicPresentation(did, didJwtVc, contextName, {
			key: encryptionKey,
		}, options)) as VCResult;

		return result;
	}
	/**
	 *  Method for for publishing an encrypted credential data
	 * @param did
	 * @param didJwtVc
	 * @param contextName
	 * @param options
	 * @returns {object}
	 */

	async issuePublicPresentation(
		did: string,
		didJwtVc: any,
		contextName: string,
		options: any,
		createPresentationOptions: CreatePresentationOptions = {removeOriginalFields: false}
	): Promise<VCResult | unknown> {
		const defaults = {
			encrypt: true,
			key: EncryptionUtils.randomKey(32),
			permissions: {
				read: PermissionOptionsEnum.PUBLIC,
				write: PermissionOptionsEnum.OWNER,
			},
			credentialExplorerUrl: 'https://explorer.verida.network/credential'
		};

		options = _.merge(defaults, options);
		options = _.merge(
			{
				schema: options.encrypt ? SCHEMAs.encrypted : SCHEMAs.default,
			},
			options
		);

		const schemas = await this.context.getClient().getSchema(options.schema);

		const json: any = await schemas.getSchemaJson();

		const dbName = json.database.name;

		const publicCredentials = await this.context.openDatabase(dbName, {
			permissions: options.permissions,
		});

		let params = {};

		// Generate verifiable presentation
		const credentials = new Credentials()
		const presentation = await credentials.createVerifiablePresentation([didJwtVc], this.context, undefined, createPresentationOptions)

		let item

		if (options.encrypt) {
			const key = new Uint8Array(options.key);
			const content = EncryptionUtils.symEncrypt(presentation, key);
			item = {
				content: content,
				schema: options.schema,
			};
			params = {
				key: options.key,
			};
		}

		const result = (await publicCredentials.save(item, {})) as any;

		if (!result) {
			throw new Error('unable to save jwt item to db')
		}
		const uri = buildVeridaUri(did, contextName, dbName, result.id, ['content'], params) as any

		return {
			item,
			result,
			did,
			veridaUri: uri,
			publicUri: `${options.credentialExplorerUrl}?uri=${encodeUri(uri)}`
		};

	}
}
