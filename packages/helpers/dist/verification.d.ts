/**
 * Uses `/.well-known/did.json` standard
 *
 * @see https://w3c-ccg.github.io/did-method-web/
 * @see https://team.verida.network/.well-known/did.json
 *
 * @param did DID that is expected to control the domain name
 * @param domain Domain (ie: team.verida.network) that is expected to be controlled by the DID. If protocol is specified (ie: `https`) it will automatically be stripped. HTTPS is forced.
 */
export declare function verifyDidControlsDomain(did: string, domain: string): Promise<boolean>;
