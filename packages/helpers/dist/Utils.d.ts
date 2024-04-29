import { FetchUriParams, IClient } from '@verida/types';
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
export declare function buildVeridaUri(did: string, contextName: string, databaseName: string, itemId?: string, deepAttributes?: string[], params?: {
    key?: string;
}): string;
/**
 * Explode a Verida URI into it's individual pieces
 *
 * @param uri
 * @returns
 */
export declare function explodeVeridaUri(uri: string): FetchUriParams;
/**
 * Fetch the data accessible from a Verida URI
 *
 * @param uri Verida URI of the record to access. If `key` is in the query parameters, it is used as a (hex) encryption key to decode the data
 * @param context An existing context used to open the external database
 * @returns
 */
export declare function fetchVeridaUri(uri: string, client: IClient): Promise<any>;
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
export declare function wrapUri(veridaUri: string, wrapperUri?: string): string;
/**
 * Encode a Verida URI in base58 to create a unique string reference on the network
 *
 * @param veridaUri
 * @returns
 */
export declare function encodeUri(veridaUri: string): any;
/**
 * Decode a Verida URI from base58 to it's `verida://` URI format
 */
export declare function decodeUri(encodedVeridaUri: string): string;
export interface DIDParts {
    network: string;
    address: string;
}
/**
 * Get the `network` and `address` parts of a DID
 *
 * @param did
 */
export declare function explodeDID(did: string): {
    network: string;
    address: string;
};
