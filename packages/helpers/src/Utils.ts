import EncryptionUtils from '@verida/encryption-utils';
import { DatabasePermissionOptionsEnum, FetchUriParams } from '@verida/types';
const url = require('url')
const bs58 = require('bs58');

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
	const bytes = Buffer.from(contextName);
	const encodedContextName = bs58.encode(bytes);
	let uri = `verida://${did}/${encodedContextName}`;

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
	const regex = /^verida:\/\/([^\/]*)\/([^\/]*)\/([^\/]*)(\/([^?]*))?/i;
	const matches = uri.match(regex);

	if (!matches) {
		throw new Error('Invalid URI');
	}

	const did = matches[1] as string;
	const encodedContextName = matches[2];
	const bytes = bs58.decode(encodedContextName);
	const contextName = Buffer.from(bytes).toString();
	const dbName = matches[3];
	const id = matches[5];
	const urlParts = url.parse(uri, true);
	const query = urlParts.query

	return {
		did,
		contextName,
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
export async function fetchVeridaUri(uri: string, context: any): Promise<any> {
	const uriParts = explodeVeridaUri(uri);

	const db = await context.openExternalDatabase(uriParts.dbName, uriParts.did, {
		permissions: {
			read: DatabasePermissionOptionsEnum.PUBLIC,
			write: DatabasePermissionOptionsEnum.OWNER,
		},
		//@ts-ignore
		contextName: uriParts.contextName,
		readOnly: true,
	});

	try {
		const item: any = await db.get(uriParts.id, {});
		if (uriParts.query && uriParts.query.key) {
			// Return encrypted data if provided with an encryption key
			const key = Buffer.from(uriParts.query.key as string, 'hex');
			return EncryptionUtils.symDecrypt(item.content, key);
		}

		// Otherwise return the actual data
		return item;
	} catch (err: any) {
		if (err.error == 'not_found') {
			throw new Error('Document does not exist ');
		}

		throw err;
	}
}

/**
 * Wrap a Verida URI in a wrapper URI that handles fetching the record and returning it.
 * 
 * ie: wrapUri('http://data.verida.network', ...)
 * 
 * @param wrapperUri HTTP(s) endpoint that handles base64 decoding the Verida URI and returning it
 * @param veridaUri Verida URI
 * @param separator optional separator (defaults to `/`)
 * @returns 
 */
export function wrapUri(veridaUri: string, wrapperUri: string = 'http://data.verida.network/') {
	const uriParts = explodeVeridaUri(veridaUri)

	const bytes = Buffer.from(veridaUri)
	const encodedVeridaUri = bs58.encode(bytes)
	return `${wrapperUri}${uriParts.id ? 'row' : 'db'}/${encodedVeridaUri}`
}

export interface DIDParts {
	network: string,
	address: string
}

/**
 * 
 * @param did 
 */
export function explodeDID(did: string) {
	const parts = did.split(':')
	if (parts.length != 4) {
		throw new Error('Invalid DID')
	}

	return {
		network: parts[2],
		address: parts[3]
	}
}