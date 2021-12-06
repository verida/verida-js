// https://github.com/decentralized-identity/did-jwt
import { createJWT, ES256KSigner } from 'did-jwt'
import { encodeBase64 } from 'tweetnacl-util'

// https://github.com/decentralized-identity/did-jwt-vc
import { createVerifiableCredentialJwt, createVerifiablePresentationJwt, verifyPresentation, verifyCredential } from 'did-jwt-vc'

// Note: See @verida/account/src/account.ts

/**
 * A bare minimum class implementing the creation and verification of
 * Verifiable Credentials and Verifiable Presentations represented as
 * DID-JWT's
 */
export default class Credentials {

    /**
     * Create a verifiable credential.
     * 
     * Example:
     * 
     * ```
     * credential = {
     *   "@context": [
     *       "https://www.w3.org/2018/credentials/v1",
     *       "https://www.w3.org/2018/credentials/examples/v1"
     *   ],
     *   "id": "https://example.com/credentials/1872",
     *   "type": ["VerifiableCredential", "AlumniCredential"],
     *   "issuer": "https://example.edu/issuers/565049",
     *   "issuanceDate": "2010-01-01T19:23:24Z",
     *   "credentialSubject": {
     *       "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
     *       "alumniOf": "Example University"
     *   }
     * };
     * ```
     * 
     * @param {object} credential JSON representing a verifiable credential
     * @param {object} issuer A credential issuer object obtained by calling `createIssuer(user)`
     * @return {string} DID-JWT representation of the Verifiable Credential
     */
     static async createVerifiableCredential(credential, issuer: @verida/account) {
        // Create the payload
        const vcPayload = {
            sub: issuer.did,
            vc: credential
        };

        // Create the verifiable credential
        return await createVerifiableCredential(vcPayload, issuer);
    }

    /**
     * Create a verifiable presentation that combines an array of Verifiable
     * Credential DID-JWT's
     * 
     * @param {array} vcJwts Array of Verifiable Credential DID-JWT's
     * @param {object} issuer A credential issuer object obtained by calling `createIssuer(user)` 
     */
    static async createVerifiablePresentation(vcJwts, issuer) {
        const vpPayload = {
            vp: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiablePresentation'],
                verifiableCredential: vcJwts
            }
        };
          
        return createPresentation(vpPayload, issuer);
    }

    /**
     * Verify a Verifiable Presentation DID-JWT
     * 
     * @param {string} vpJwt 
     */
    static async verifyPresentation(vpJwt) {
        let resolver = Credentials._getResolver();
        return verifyPresentation(vpJwt, resolver);
    }

    /**
     * Verify a Verifiable Credential DID-JWT
     * 
     * @param {string} vcJwt 
     */
    static async verifyCredential(vcJwt) {
        let resolver = Credentials._getResolver();
        return verifyCredential(vcJwt, resolver);
    }

    /**
     * Create an Issuer object that can issue Verifiable Credentials
     * 
     * @param {object} user A Verida user instance
     * @return {object} Verifiable Credential Issuer
     */
    static async createIssuer(user) {
        // Get the current user's keyring
        const appConfig = await user.getAppConfig();
        let keyring = appConfig.keyring;

        let privateKey = encodeBase64(keyring.signKey.privateBytes);

        let signer = didJWT.NaclSigner(privateKey);
        const issuer = {
            did: appConfig.vid,
            signer,
            alg: "Ed25519"  // must be this casing due to did-jwt/src/JWT.ts
        };

        return issuer;
    }

    /**
     * Fetch a credential from a Verida URI
     * 
     * @param {string} uri
     * @return {string} DIDJWT representation of the credential
     */
    static async fetch(uri) {
        let regex = /^verida:\/\/(.*)\/(.*)\/(.*)\?(.*)$/i;
        let matches = uri.match(regex);

        if (!matches) {
            throw new Error("Invalid URI");
        }

        const vid = matches[1];
        const dbName = matches[2];
        const id = matches[3];
        const query = url.parse(uri,true).query;

        const { did, appName } = await Verida.Helpers.vid.convertVid(vid)

        let db = await Verida.openExternalDatabase(dbName, did, {
            permissions: {
                read: "public",
                write: "owner"
            },
            appName: appName,
            readOnly: true
        });

        const item = await db.get(id);
        const encrypted = item.content;
        const key = Buffer.from(query.key, 'hex');

        const decrypted = Verida.Helpers.encryption.symDecrypt(encrypted, key);
        return decrypted;
    }

    static _getResolver() {
        return new Resolver(getResolver());
    }

}