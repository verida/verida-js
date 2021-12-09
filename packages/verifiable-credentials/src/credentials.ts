import Encryption from '@verida/encryption-utils';
import { encodeBase64 } from 'tweetnacl-util';
import { ES256KSigner } from 'did-jwt';
import { Resolver } from 'did-resolver';
import vdaResolver from '@verida/did-resolver';
import {
	createVerifiableCredentialJwt,
	createVerifiablePresentationJwt,
	verifyPresentation,
	verifyCredential,
	JwtCredentialPayload,
	Issuer,
} from 'did-jwt-vc';
import url from 'url';
import { Context } from '@verida/client-ts';
import { PermissionOptionsEnum } from '@verida/client-ts/dist/context/interfaces';
/**
 * A bare minimum class implementing the creation and verification of
 * Verifiable Credentials and Verifiable Presentations represented as
 * DID-JWT's
 */

const DID_REGISTRY_ENDPOINT = 'https://dids.testnet.verida.io:5001';

export default class Credentials {
	context: Context;

	constructor(context: Context) {
		this.context = context;
	}
	/**
	 * Create a verifiable credential.
	 *
	 * @param {object} credential JSON representing a verifiable credential
	 * @param {object} issuer A credential issuer object obtained by calling `createIssuer(user)`
	 * @return {string} DID-JWT representation of the Verifiable Credential
	 */
	async createVerifiableCredential(
		credential: any,
		issuer: any
	): Promise<string> {
		// Create the payload
		const vcPayload: JwtCredentialPayload = {
			sub: issuer.did,
			vc: credential,
		};
		// Create the verifiable credential
		return await createVerifiableCredentialJwt(vcPayload, issuer);
	}

	/**
	 * Create a verifiable presentation that combines an array of Verifiable
	 * Credential DID-JWT's
	 *
	 * @param {array} vcJwts Array of Verifiable Credential DID-JWT's
	 * @param {object} issuer A credential issuer object obtained by calling `createIssuer(user)`
	 */
	async createVerifiablePresentation(
		vcJwts: string[],
		issuer: any
	): Promise<string> {
		const vpPayload = {
			vp: {
				'@context': ['https://www.w3.org/2018/credentials/v1'],
				type: ['VerifiablePresentation'],
				verifiableCredential: vcJwts,
			},
		};

		return createVerifiablePresentationJwt(vpPayload, issuer);
	}

	/**
	 * Verify a Verifiable Presentation DID-JWT
	 *
	 * @param {string} vpJwt
	 */
	async verifyPresentation(vpJwt: string): Promise<unknown> {
		const resolver = this.getResolver();
		return verifyPresentation(vpJwt, resolver);
	}

	/**
	 * Verify a Verifiable Credential DID-JWT
	 *
	 * @param {string} vcJwt
	 */
	async verifyCredential(vcJwt: string): Promise<unknown> {
		const resolver = this.getResolver();
		return verifyCredential(vcJwt, resolver);
	}

	/**
	 * Create an Issuer object that can issue Verifiable Credentials
	 *
	 * @param {object} user A Verida user instance
	 * @return {object} Verifiable Credential Issuer
	 */

	async createIssuer(): Promise<Issuer> {
		const account = this.context.getAccount();
		const contextName = this.context.getContextName();
		const did = await account.did();

		const keyring = await account.keyring(contextName);
		const keys = await keyring.getKeys();
		const privateKey = encodeBase64(keys.signPrivateKey);

		const signer = ES256KSigner(privateKey);

		const issuer = {
			did,
			signer,
			alg: 'ES256K',
		} as Issuer;

		return issuer;
	}

	/**
	 * Fetch a credential from a Verida URI
	 *
	 * @param {string} uri
	 * @return {string} DIDJWT representation of the credential
	 */
	async fetchURI(uri: string): Promise<string> {
		const regex = /^verida:\/\/(.*)\/(.*)\/(.*)\/(.*)\?(.*)$/i;
		const matches = uri.match(regex);

		if (!matches) {
			throw new Error('Invalid URI');
		}

		const did = matches[1];
		const contextHash = matches[2];
		const dbName = matches[3];
		const id = matches[4];
		const query = url.parse(uri, true).query;

		const db = await this.context.openExternalDatabase(dbName, did, {
			permissions: {
				read: PermissionOptionsEnum.PUBLIC,
				write: PermissionOptionsEnum.OWNER,
			},
			contextHash: contextHash,
			readOnly: true,
		});

		const item = await db.get(id, {});

		const key = Buffer.from(query.key as string, 'hex');

		const decrypted = Encryption.symDecrypt(item.content, key);

		return decrypted;
	}

	getResolver(): any {
		const resolver = vdaResolver.getResolver(DID_REGISTRY_ENDPOINT);
		return new Resolver(resolver);
	}
}
