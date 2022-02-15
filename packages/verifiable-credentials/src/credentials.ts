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
	private errors: string[] = [];

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
	 * @param {object} vc JSON representing a verifiable credential
	 * @param {object} issuer A credential issuer object obtained by calling `createIssuer(user)`
	 * @return {string} DID-JWT representation of the Verifiable Credential
	 */
	async createVerifiableCredential(
		vc: any,
		issuer: any
	): Promise<string> {
		// Create the payload
		const vcPayload: JwtCredentialPayload = {
			vc,
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
	 * @param {string} currentDateTime to allow the client to migrate cases where the datetime is incorrect on the local computer
	 */
	async verifyCredential(vcJwt: string, currentDateTime?: string): Promise<any> {
		const resolver = this.getResolver();
		const decodedCredential = await verifyCredential(vcJwt, resolver);

		if (decodedCredential) {
			const payload = decodedCredential.payload
			const vc = payload.vc

			/**
			 * The expirationDate property must be a string value of XMLSCHEMA11-2 if provided
			 * see https://www.w3.org/TR/vc-data-model/#expiration
			 */

			if (vc.expirationDate) {
				// Ensure credential hasn't expired
				let now;
				if (currentDateTime) {
					now = currentDateTime
				} else {
					now = new Date().toISOString()
				}
				if (vc.expirationDate < now) {
					this.errors.push('Credential has expired');
					return false;
				}
			}
		}

		return decodedCredential
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
	async createCredentialJWT(subjectId: string, data: any, expirationDate?: string, issuanceDate?: string): Promise<object> {
		// Ensure a credential schema has been specified
		if (!data.schema) {
			throw new Error('No schema specified')
		}

		// Ensure data matches specified schema
		const schema = await this.context.getClient().getSchema(data.schema)
		const isValid = await schema.validate(data);

		// @todo: Check the schema is a "credential" schema type?

		if (!isValid) {
			throw new Error('Data does not match specified schema')
		}

		const issuer = await this.createIssuer();
		const account = this.context.getAccount();
		const did = await account.did();

		const vcPayload: any = {
			'@context': [
				'https://www.w3.org/2018/credentials/v1',
				'https://www.w3.org/2018/credentials/examples/v1',
			],
			sub: subjectId,
			type: ['VerifiableCredential'],
			issuer: did,
			issuanceDate: new Date().toISOString(),
			credentialSubject: {
				...data
			},
			credentialSchema: {
				id: data.schema,
				type: 'JsonSchemaValidator2018',
			},
		};

		if (expirationDate) {
			// @todo: verify expiration date is a valid date string
			vcPayload.expirationDate = expirationDate
		}

		if (issuanceDate) {
			vcPayload.issuanceDate = issuanceDate
		} else {
			vcPayload.issuanceDate = new Date().toISOString()
		}

		const didJwtVc = await this.createVerifiableCredential(vcPayload, issuer);

		const item = {
			didJwtVc: didJwtVc,
		};

		return item;
	}

	private getResolver(): any {
		const resolver = vdaResolver.getResolver(DID_REGISTRY_ENDPOINT);
		return new Resolver(resolver);
	}

	public getErrors() {
		return this.errors;
	}
}
