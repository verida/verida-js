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
import { Context } from '@verida/client-ts';

/**
 * A bare minimum class implementing the creation and verification of
 * Verifiable Credentials and Verifiable Presentations represented as
 * DID-JWT's
 */

const DID_REGISTRY_ENDPOINT = 'https://dids.testnet.verida.io:5001';

export default class Credentials {
	private context: Context;

	/**
	 * Initialize a new credential issuer and verifier instance
	 * 
	 * @param context The context (must have an account connected) that will issue any new credentials
	 */
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

	private async createIssuer(): Promise<Issuer> {
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
	 * Create a new credential DID-JWT for a given object.
	 * 
	 * A new property `didJwtVc` is added to the data and included in the response
	 * 
	 * @param data 
	 * @returns 
	 */
	async createCredentialJWT(data: any): Promise<object> {
		const issuer = await this.createIssuer();
		const account = this.context.getAccount();
		const did = await account.did();

		const credential = {
			'@context': [
				'https://www.w3.org/2018/credentials/v1',
				'https://www.w3.org/2018/credentials/examples/v1',
			],
			id: '',
			type: ['VerifiableCredential'],
			issuer: did,
			issuanceDate: new Date().toISOString(),
			credentialSubject: {
				...data,
			},
			credentialSchema: {
				id: data.schema,
				type: 'JsonSchemaValidator2018',
			},
		};
		const didJwtVc = await this.createVerifiableCredential(credential, issuer);

		const item = {
			didJwtVc: didJwtVc,
		};

		return item;
	}

	private getResolver(): any {
		const resolver = vdaResolver.getResolver(DID_REGISTRY_ENDPOINT);
		return new Resolver(resolver);
	}
}
