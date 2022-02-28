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
import { credentialDateOptions } from './interfaces';

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

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
		issuer?: any
	): Promise<string> {
		if (!issuer) {
			issuer = await this.createIssuer()
		}

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
				const expDate = dayjs(vc.expirationDate).utc(true)
				if (currentDateTime) {
					now = dayjs(currentDateTime).utc(true)
				} else {
					now = dayjs(new Date().toISOString()).utc(true)
				}

				if (expDate.diff(now) < 0) {
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
	async createCredentialJWT(subjectId: string, data: any, options?: credentialDateOptions): Promise<object> {
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

		if (options && options.expirationDate) {
			// The DID JWT VC library (called by createVerifiableCredential) verifies the string format so we do not need a test for that
			vcPayload.expirationDate = options.expirationDate
		}

		if (options && options.issuanceDate) {
			// validate ISO UTC date format 
			const regex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/
			if (!regex.test(options.issuanceDate)) {
				throw new Error('Date format does not match ISO standard')
			}

			vcPayload.issuanceDate = options.issuanceDate
		} else {
			const issuanceDate = dayjs(new Date().toISOString()).utc(true).second() - dayjs(vcPayload.issuanceDate).utc(true).second()

			if (issuanceDate > 10) {
				throw new Error('provided issuance date is greater than 10 seconds from ')
			}
		}
		const didJwtVc = await this.createVerifiableCredential(vcPayload, issuer);

		data['didJwtVc'] = didJwtVc
		
		return data
	}

	private getResolver(): any {
		const resolver = vdaResolver.getResolver(DID_REGISTRY_ENDPOINT);
		return new Resolver(resolver);
	}

	public getErrors() {
		return this.errors;
	}
}
