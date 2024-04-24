import { ES256KSigner } from 'did-jwt';
import { Resolver } from 'did-resolver';
import { getResolver } from '@verida/vda-did-resolver';
import {
	createVerifiableCredentialJwt,
	createVerifiablePresentationJwt,
	verifyPresentation,
	verifyCredential,
	JwtCredentialPayload,
	Issuer,
} from 'did-jwt-vc';
import { CreateCredentialJWT, VERIDA_CREDENTIAL_SCHEMA, VeridaCredentialRecord, VeridaCredentialSchema, VerifiableCredentialResponse } from './interfaces';
import { IContext, Web3ResolverConfigurationOptions } from '@verida/types';
import EncryptionUtils from '@verida/encryption-utils';
import Axios from 'axios'

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

/**
 * A bare minimum class implementing the creation and verification of
 * Verifiable Credentials and Verifiable Presentations represented as
 * DID-JWT's
 */
export default class Credentials {
	private errors: string[] = [];

	/**
	 * Initialize a new credential issuer and verifier instance
	 * 
	 * @param context The context (must have an account connected) that will issue any new credentials
	 */

	/**
	 * Create a verifiable credential.
	 *
	 * @param {object} vc JSON representing a verifiable credential
	 * @param {object} issuer A credential issuer object obtained by calling `createIssuer(user)`
	 * @return {string} DID-JWT representation of the Verifiable Credential
	 */
	public async createVerifiableCredential(
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
	 * Create a Verifiable Credential record that can be saved into the 
	 * credential datastore.
	 * 
	 * @param vc 
	 * @param issuer 
	 */
	public async createVerifiableCredentialRecord(
		createCredentialData: CreateCredentialJWT,
		name: string,
		summary?: string,
		icon?: string
	): Promise<VeridaCredentialRecord> {
		const didJwtVc = await this.createCredentialJWT(createCredentialData)

		const { data, schema } = createCredentialData

		const {
			vc,
			issuer
		} = await this.buildVerifiableCredential(createCredentialData)

		return {
			name,
			summary,
			schema: VERIDA_CREDENTIAL_SCHEMA,
			credentialData: vc,
			credentialSchema: schema,
			icon,
			didJwtVc
		}
	}

	/**
	 * Create a verifiable presentation that combines an array of Verifiable
	 * Credential DID-JWT's
	 *
	 * @param {array} vcJwts Array of Verifiable Credential DID-JWT's
	 * @param {object} issuer A credential issuer object obtained by calling `createIssuer(user)`
	 */
	public async createVerifiablePresentation(
		vcJwts: string[],
		context: IContext,
		issuer?: any,
	): Promise<string> {
		if (!issuer) {
			issuer = await this.createIssuer(context)
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
	 * @param {string} didRegistryEndpoint
	 */
	public static async verifyPresentation(vpJwt: string, resolverConfig: Web3ResolverConfigurationOptions): Promise<any> {
		const resolver = Credentials.getResolver(resolverConfig);
		return verifyPresentation(vpJwt, resolver);
	}

	/**
	 * Verify a Verifiable Credential DID-JWT
	 *
	 * @param {string} vcJwt
	 * @param {string} didRegistryEndpoint
	 * @param {string} currentDateTime to allow the client to migrate cases where the datetime is incorrect on the local computer
	 */
	public async verifyCredential(vcJwt: string, resolverConfig?: Web3ResolverConfigurationOptions, currentDateTime?: string): Promise<any> {
		this.errors = []
		const resolver = Credentials.getResolver(resolverConfig);
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

	public async createIssuer(context: IContext): Promise<Issuer> {
		const { privateKey, did } = await this.getContextInfo(context)
		const signer = ES256KSigner(privateKey);

		const issuer = {
			did,
			signer,
			alg: 'ES256K',
		} as Issuer;

		return issuer
	}

	public async getContextInfo(context: IContext) {
		const account = context.getAccount();
		const contextName = context.getContextName();
		const did = await account.did();

		const keyring = await account.keyring(contextName);
		const keys = await keyring.getKeys();

		return {
			privateKey: keys.signPrivateKey,
			did
		}
	}


	/**
	 * Build a new Verifiable Credential object
	 * 
	 * @param data 
	 * @returns Verifiable Credential
	 */
	public async buildVerifiableCredential({ subjectId, data, schema, context, payload, options }: CreateCredentialJWT): Promise<VerifiableCredentialResponse> {
		// Ensure a credential schema has been specified
		if (!schema) {
			throw new Error('No schema specified')
		}

		// Ensure data matches specified schema
		const schemaObj = await context.getClient().getSchema(schema)
		const isValid = await schemaObj.validate(data);

		if (!isValid) {
			this.errors = schemaObj.errors
			throw new Error('Data does not match specified schema')
		}

		const issuer = await this.createIssuer(context);
		const account = context.getAccount();
		const did = await account.did();

		// Add custom proof strings
		if (options && options.proofStrings) {
			if (!payload) {
				payload = {}
			}

			const { privateKey } = await this.getContextInfo(context)
			const { payloadProofs } = await this.buildProofs(options.proofStrings, data, privateKey)
			payload.proofs = payloadProofs
		}

		// Add schema specified proof strings
		const credentialSchema = await this.getCredentialSchema(schema)
		if (credentialSchema.veridaProofs) {
			if (!payload) {
				payload = {}
			}

			const { privateKey } = await this.getContextInfo(context)
			const { payloadProofs } = await this.buildProofs(credentialSchema.veridaProofs, data, privateKey)
			payload.proofs = {
				...payload.proofs,
				...payloadProofs
			}
		}

		const vcPayload: any = {
			'@context': [
				'https://www.w3.org/2018/credentials/v1',
			],
			sub: subjectId,
			type: ['VerifiableCredential'],
			issuer: did,
			veridaContextName: context.getContextName(),
			issuanceDate: new Date().toISOString(),
			credentialSubject: {
				...data
			},
			credentialSchema: {
				id: schema,
				type: 'JsonSchemaValidator2018',
			},
			...(payload ? payload : {})
		};
		if (options && options.expirationDate) {
			// The DID JWT VC library (called by createVerifiableCredential) verifies the string format so we do not need a test for that
			const dateFormat = dayjs(options.expirationDate).utc(true)
			if (dateFormat.$d.toString() === 'Invalid Date') {
				throw new Error('Date format does not match ISO standard')
			}
			vcPayload.expirationDate = options.expirationDate
		}

		if (options && options.issuanceDate) {
			const dateFormat = dayjs(options.issuanceDate).utc(true)
			if (dateFormat.$d.toString() === 'Invalid Date') {
				throw new Error('Date format does not match ISO standard')
			}

			vcPayload.issuanceDate = dateFormat.$d
		}

		return {
			vc: vcPayload,
			issuer
		}
	}

	public async createCredentialJWT({ subjectId, data, schema, context, payload, options }: CreateCredentialJWT): Promise<string> {
		const {
			vc,
			issuer
		} = await this.buildVerifiableCredential({ subjectId, data, schema, context, payload, options })

		return await this.createVerifiableCredential(vc, issuer)
	}

	private static getResolver(resolverConfig?: Web3ResolverConfigurationOptions): any {
		const resolver = getResolver(resolverConfig);
		// @ts-ignore
		return new Resolver(resolver);
	}

	public getErrors() {
		return this.errors;
	}

	public async getCredentialSchema(schemaUrl: string): Promise<VeridaCredentialSchema> {
		const credentialSchemaData = await Axios.get(schemaUrl, {
			responseType: "json",
		});

		return credentialSchemaData.data
	}


	// @todo: Get proof strings that were used to generate the proofs
	public async getProofStrings(credential: VeridaCredentialRecord): Promise<Record<string, string[]>> {
		const credentialSchema = await this.getCredentialSchema(credential.credentialSchema)
		if (!credentialSchema.veridaProofs) {
			return {}
		}

		const { proofStrings } = this.buildProofs(credentialSchema.veridaProofs, credential.credentialData)
		return proofStrings
	}

	private buildProofs(proofs: Record<string, string[]>, data: Record<string, string | object>, privateSignKey?: Uint8Array) {
		const payloadProofs: any = {}
		const proofStrings: any = {}
			
		for (let key in proofs) {
			const proofItems: string[] = proofs[key]

			for (let i in proofItems) {
				const proofItem = proofItems[i]

				if (proofItem.startsWith('$')) {
					proofItems[i] = <string> data[proofItem.substring(1)]
				}
			}

			const proofString = proofItems.join('-')
			if (privateSignKey) {
				const sig = EncryptionUtils.signData(proofString, privateSignKey)
				payloadProofs[key] = sig
			}

			proofStrings[key] = proofString
		}

		return {
			payloadProofs,
			proofStrings
		}
	}
}
