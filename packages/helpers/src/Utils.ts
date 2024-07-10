import EncryptionUtils from '@verida/encryption-utils';
import { DatabasePermissionOptionsEnum, FetchUriParams, IClient, Network } from '@verida/types';
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
	network: Network,
	did: string,
	contextName: string,
	databaseName: string,
	itemId?: string,
	deepAttributes?: string[],
	params?: { key?: string }
): string {
	let uri = `verida://${did}/${network}/${encodeURI(contextName)}`;

	if (databaseName) {
		uri += `/${databaseName}`;
	}

	if (itemId) {
		uri += `/${itemId}`;
	}

	if (deepAttributes) {
		deepAttributes.forEach((attr: string) => {
			uri += `/${attr}`
		})
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
	const regex = /^verida:\/\/(did\:[^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^?]*)(\/([^?]*))?/i;
	const matches = uri.match(regex)

	if (!matches) {
		throw new Error('Invalid URI');
	}

	const did = matches[1] as string
	const network = matches[2] as string
	const contextName = decodeURI(matches[3])
	const dbName = matches[4]
	const recordString = matches[5]
	const recordParts = recordString.split('/')
	const recordId = recordParts[0]


	const urlParts = url.parse(uri, true);
	const query = urlParts.query

	return {
		did,
		network: <Network> network,
		contextName,
		dbName,
		recordId,
		deepAttributes: recordParts.splice(1).filter((value) => value != ''),
		query
	};
}

/**
 * Fetch the data accessible from a Verida URI
 *
 * @param uri Verida URI of the record to access. If `key` is in the query parameters, it is used as a (hex) encryption key to decode the data
 * @param context An existing context used to open the external database
 * @returns
 */
export async function fetchVeridaUri(uri: string, client: IClient): Promise<any> {
	const uriParts = explodeVeridaUri(uri);
	const context = await client.openExternalContext(uriParts.contextName, uriParts.did)

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
		let item: any = await db.get(uriParts.recordId, {});
		if (uriParts.deepAttributes.length) {
			item = getDeepAttributeValue(item, uriParts.deepAttributes)
		}

		if (uriParts.query && uriParts.query.key) {
			// Return encrypted data if provided with an encryption key
			const key = Buffer.from(uriParts.query.key as string, 'hex')
			item = EncryptionUtils.symDecrypt(item, key)
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

function getDeepAttributeValue(data: any, deepAttributes: string[]): any {
	const nextAttribute = deepAttributes[0]
	if (typeof data[nextAttribute] === 'undefined') {
		throw new Error('Invalid attribute path')
	}

	if (deepAttributes.length == 1) {
		return data[nextAttribute]
	}

	return getDeepAttributeValue(data[nextAttribute], deepAttributes.splice(1))
}

/**
 * Wrap a Verida URI in a wrapper URI that handles fetching the record and returning it.
 * 
 * ie: wrapUri('http://data.verida.network', ...)
 * 
 * @param wrapperUri HTTP(s) endpoint that fetches a Verida URI
 * @param veridaUri Verida URI
 * @param separator optional separator (defaults to `/`)
 * @returns 
 */
export function wrapUri(veridaUri: string, wrapperUri: string = 'https://data.verida.network') {
	const encodedVeridaUri = encodeUri(veridaUri)
	return `${wrapperUri}/${encodedVeridaUri}`
}

/**
 * Encode a Verida URI in base58 to create a unique string reference on the network
 * 
 * @param veridaUri 
 * @returns 
 */
export function encodeUri(veridaUri: string) {
	const bytes = Buffer.from(veridaUri)
	const encodedVeridaUri = bs58.encode(bytes)
	return encodedVeridaUri
}

/**
 * Decode a Verida URI from base58 to it's `verida://` URI format
 */
export function decodeUri(encodedVeridaUri: string) {
	const bytes = bs58.decode(encodedVeridaUri)
	const veridaUri = Buffer.from(bytes).toString()
	return veridaUri
}

export interface DIDParts {
	network: string,
	address: string
}

/**
 * Get the `network` and `address` parts of a DID
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