import EncryptionUtils from '@verida/encryption-utils';
import url from 'url';
import { Context } from '.';
import { PermissionOptionsEnum } from './context/interfaces';
import { FetchUriParams } from './interfaces';

/**
 * Build a URI that represents a specific record in a database
 * 
 * @param did 
 * @param contextName 
 * @param databaseName 
 * @param itemId 
 * @param params 
 * @returns 
 */
export function buildVeridaUri(
	did: string,
	contextName: string,
	databaseName: string,
	itemId?: string,
	params?: { key?: string }
): string {
	const contextHash = EncryptionUtils.hash(`${did}/${contextName}`);
	let uri = `verida://${did}/${contextHash}`;

	if (databaseName) {
		uri += `/${databaseName}`;
	}

	if (itemId) {
		uri += `/${itemId}`;
	}

	if (params && params.key) {
		const encryptionKey = Buffer.from(params.key).toString('hex');
		uri += '?key=' + encryptionKey;
	}

	return uri;
}

/**
 * Explode a Verida URI into it's individual pieces
 * 
 * @param uri 
 * @returns 
 */
export function explodeVeridaUri(uri: string): FetchUriParams {
	const regex = /^verida:\/\/(.*)\/(.*)\/(.*)\/(.*)\?(.*)$/i;
	const matches = uri.match(regex);

	if (!matches) {
		throw new Error('Invalid URI');
	}

	const did = matches[1] as string;
	const contextHash = matches[2];
	const dbName = matches[3];
	const id = matches[4];
	const query = url.parse(uri, true).query;

	return {
		did,
		contextHash,
		dbName,
		id,
		query,
	};
}

/**
 * Fetch the data accessible from a Verida URI
 * 
 * @param uri Verida URI of the record to access
 * @param context An existing context used to open the external database
 * @returns 
 */
export async function fetchVeridaUri(
	uri: string,
	context: Context
): Promise<string> {
	const url = explodeVeridaUri(uri);

	const db = await context.openExternalDatabase(url.dbName, url.did, {
		permissions: {
			read: PermissionOptionsEnum.PUBLIC,
			write: PermissionOptionsEnum.OWNER,
		},
		//@ts-ignore
		contextHash: url.contextHash,
		readOnly: true,
	});

	const item = (await db.get(url.id, {})) as any;

	if (item.error) {
		throw new Error('document does not exist ');
	}

	const key = Buffer.from(url.query.key as string, 'hex');

	const decrypted = EncryptionUtils.symDecrypt(item.content, key);

	return decrypted;
}
