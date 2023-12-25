import { IProfile, IClient, ClientConfig, DefaultClientConfig, IAccount, IContext, EnvironmentType, SecureContextConfig, SecureContextEndpointType } from "@verida/types";
import { DIDClient } from "@verida/did-client";
import { VeridaNameClient } from '@verida/vda-name-client'

import Context from "./context/context";
import DIDContextManager from "./did-context-manager";
import Schema from "./context/schema";
import DEFAULT_CONFIG from "./config";
import Axios from "axios";
import { ServiceEndpoint } from "did-resolver";
import { DIDDocument } from "@verida/did-document";
const _ = require("lodash");

/**
 * @category
 * Modules
 */
class Client implements IClient {
  /**
   * Connection to the Verida DID Registry
   */
  public didClient: DIDClient;

  /**
   * Helper instance to manage DID contexts
   */
  private didContextManager: DIDContextManager;

  /**
   * Connected account instance
   */
  private account?: IAccount;

  /**
   * DID of connected account
   */
  private did?: string;

  /**
   * Currently selected environment
   */
  private environment: EnvironmentType;

  private nameClient: VeridaNameClient;

  /**
   * Current configuration for this client
   */
  private config: DefaultClientConfig;

  /**
   * Create a client connection to the Verida network
   *
   * @param userConfig ClientConfig Configuration for establishing a connection to the Verida network
   */
  constructor(userConfig: ClientConfig) {
    this.environment = userConfig.environment
      ? <EnvironmentType> userConfig.environment
      : DEFAULT_CONFIG.environment;

    const defaultConfig = DEFAULT_CONFIG.environments[this.environment]
      ? DEFAULT_CONFIG.environments[this.environment]
      : {};
    this.config = _.merge(defaultConfig, userConfig) as DefaultClientConfig;

    userConfig.didClientConfig = userConfig.didClientConfig ? userConfig.didClientConfig : {
      network: this.environment
    }

    this.didClient = new DIDClient({
      ...userConfig.didClientConfig,
      network: this.environment
    });

    const rpcUrl = this.didClient.getRpcUrl()
    this.nameClient = new VeridaNameClient({
      network: this.environment,
      web3Options: {
        rpcUrl
      }
  })

    this.didContextManager = new DIDContextManager(this.didClient);
    Schema.setSchemaPaths(this.config.schemaPaths!);
  }

  /**
   * Connect an Account to this client.
   *
   * Sets the account owner who can then create storage contexts,
   * authenticate with databases, send messages etc.
   *
   * @param account AccountInterface
   */
  public async connect(account: IAccount): Promise<void> {
    if (this.isConnected()) {
      throw new Error("Account is already connected.");
    }

    this.account = account;
    this.did = await this.account!.did();
    this.didContextManager.setAccount(this.account);
  }

  /**
   * Check if an account is connected to this client.
   *
   * @returns boolean True of an account is connected
   */
  public isConnected() {
    return typeof this.account != "undefined";
  }

  /**
   * Open a storage context for the current account.
   *
   * @param contextName string Name of the `context` to open.
   * @param forceCreate boolean If the `context` doesn't already exist for the connected account, create it. Depending on the type of `Account` connected, this may open a prompt for the user to confirm (and sign).
   * @returns Context | undefined
   */
  public async openContext(
    contextName: string,
    forceCreate: boolean = true
  ): Promise<IContext | undefined> {
    if (forceCreate) {
      if (!this.account) {
        throw new Error(
          "Unable to force create a storage context when not connected"
        );
      }
    }

    let contextConfig;
    if (!this.did) {
      // Attempt to fetch storage config from this account object if no DID specified
      // This is helpful in the account-web-vault that doesn't load the DID until it receives a request from the vault mobile app
      contextConfig = await this.account!.storageConfig(
        contextName,
        forceCreate
      );
      this.did = await this.account!.did();
    }

    if (!this.did) {
      throw new Error("No DID specified and no authenticated user");
    }

    if (!contextConfig) {
      contextConfig = await this.didContextManager.getDIDContextConfig(
        this.did!,
        contextName,
        forceCreate
      );
    }

    if (!contextConfig) {
      throw new Error(
        "Unable to locate requested storage context for requested DID. Force create?"
      );
    }

    // @todo cache the storage contexts
    return new Context(this, contextName, this.didContextManager, this.account!);
  }

  /**
   * 
   * @param contextName The name of the context OR a context hash (starting with 0x)
   * @param did 
   * @returns 
   */
  public async openExternalContext(contextName: string, did: string): Promise<IContext> {
    did = await this.parseDid(did)
    const contextConfig = await this.didContextManager.getDIDContextConfig(
      did,
      contextName,
      false
    );

    if (!contextConfig) {
      throw new Error(
        "Unable to locate requested storage context for requested DID."
      );
    }

    // @todo cache the storage contexts
    return new Context(this, contextName, this.didContextManager, this.account!);
  }

  /**
   * Get the storage configuration of an application context for a given DID.
   *
   * This provides the public details about the database, storage and messaging endpoints stored on did-client/did-document  for the requested `did`.
   *
   * @param did
   * @param contextName The name of the context OR a context hash (starting with 0x)
   * @returns SecureContextConfig | undefined
   */
  public async getContextConfig(
    did: string,
    contextName: string
  ): Promise<SecureContextConfig | undefined> {
    did = await this.parseDid(did)
    return this.didContextManager.getDIDContextConfig(did, contextName, false);
  }

  public getConfig(): DefaultClientConfig {
    return this.config
  }

  /**
   * Open the public profile of any user in read only mode.
   *
   * Every application context has the ability to have it's own public profiles.
   *
   * You most likely want to request the `Verida: Vault` context.
   *
   * @param did
   * @param contextName
   * @returns `<Profile | undefined>`
   */
  public async openPublicProfile(
    did: string,
    contextName: string,
    profileName: string = "basicProfile",
    fallbackContext: string | null = "Verida: Vault"
  ): Promise<IProfile | undefined> {
    did = await this.parseDid(did)
    let context: Context | undefined;
    try {
      context = <Context> await this.openExternalContext(contextName, did);
    } catch (error) {
      if (fallbackContext) {
        return await this.openPublicProfile(did, fallbackContext, profileName, null);
      }
    }

    if (!context) {
      throw new Error(
        `Account (${did}) does not have a public profile for ${contextName}`
      );
    }

    return context!.openProfile(profileName, did);
  }

  /**
   * Get the valid data signatures for a given database record.
   *
   * Iterates through all the signatures attached to a database record and validates each signature.
   *
   * Only returns the signatures that are valid.
   *
   * @param data A single database record
   * @param did An optional did to filter the results by
   * @returns string[] Array of DIDs that have validly signed the data
   */
  public async getValidDataSignatures(
    data: any,
    did?: string
  ): Promise<string[]> {
    if (!data.signatures) {
      // no signatures
      return [];
    }

    if (did) {
      did = await this.parseDid(did)
    }

    let _data = _.merge({}, data);
    delete _data["signatures"];
    delete _data["_rev"];

    let validSignatures = [];
    for (let sigIndex in data.signatures) {
      const signature = data.signatures[sigIndex]
      const signerParts = sigIndex.match(/did:vda:([^]*):([^]*)\?context=(.*)$/);
      if (!signerParts || signerParts.length != 4) {
        continue;
      }

      const sNetwork = signerParts[1]
      const sDid = signerParts[2]
      const sContext = signerParts[3]

      const signerDid = `did:vda:${sNetwork}:${sDid}`;

      if (!did || signerDid.toLowerCase() == did.toLowerCase()) {
        const didDocument = await this.didClient.get(signerDid);
        if (!didDocument) {
          continue;
        }

        const validSig = didDocument.verifyContextSignature(
          _data,
          sContext,
          signature['secp256k1'],
          true
        );

        if (validSig) {
          validSignatures.push(signerDid);
        }
      }
    }

    return validSignatures;
  }

  public async destroyAccount() {
    // Check user authenticated
    if (!this.account) {
      throw new Error('Account must be connected to get context name from hash')
    }

    // @ts-ignore
    if (!this.account.getDidClient) {
      throw new Error('Account object is not capable of deleting DID')
    }

    // Get the DID document of this user
    // @ts-ignore
    const didDocument = <DIDDocument> await this.didClient.get(this.did!)
    const doc = didDocument.export()

    // Find all contexts for this account
    const contextNames = []
    for (let i in doc.keyAgreement) {
      // @ts-ignore
      const keyAgreement = doc.keyAgreement[i]
      const matches = keyAgreement.match(/=(0x[^&]*)/)

      if (matches.length == 2) {
        const contextHash = matches[1]
        try {
          const contextName = await this.getContextNameFromHash(contextHash, didDocument)
          contextNames.push(contextName)
        } catch (err) {
          // skip if the context hash doesn't exist
        }
      }
    }

    // Destroy all the contexts
    for (let c in contextNames) {
      await this.destroyContext(contextNames[c])
    }

    // Destroy the DID on the blockchain
    // @ts-ignore
    const didClient = await this.account!.getDIDClient()
    await didClient.destroy()

    // Logout the account
    this.account = undefined
    this.did = undefined
    this.didContextManager = new DIDContextManager(this.didClient);
  }

  public async destroyContext(contextName: string) {
    // Check user authenticated
    if (!this.account) {
      throw new Error('Account must be connected to get context name from hash')
    }

    const timestamp = parseInt(((new Date()).getTime() / 1000.0).toString())
    const did = (await this.account!.did()).toLowerCase()

    // Locate endpoints for the contextName
    const didDocument = await this.didClient.get(this.did!)
    // @ts-ignore
    const endpointInfo = didDocument.locateServiceEndpoint(contextName, SecureContextEndpointType.DATABASE)
    if (!endpointInfo) {
      throw new Error('Context not found in DID Document')
    }

    const endpointUris: ServiceEndpoint[] = <ServiceEndpoint[]> endpointInfo!.serviceEndpoint
    
    // Delete context from all endpoints
    // For each endpoint; this deletes all context databases, plus the database that tracks all databases for a context
    const promises = []
    for (let e in endpointUris) {
      let endpointUri = endpointUris[e]
      endpointUri = endpointUri.substring(0, endpointUri.length-1)  // strip trailing slash
      const consentMessage = `Delete context (${contextName}) from server: "${endpointUri}"?\n\n${did}\n${timestamp}`
      const signature = await this.account!.sign(consentMessage)
      
      promises.push(Axios.post(`${endpointUri}/user/destroyContext`, {
        did,
        timestamp,
        signature,
        contextName
      }));
    }

    const results = await Promise.allSettled(promises)
    let resultIndex = 0
    let failureCount = 0
    const promiseResults: any = {}
    for (let e in endpointUris) {
      const endpoint = endpointUris[e].toString()
      const result = results[resultIndex++]
      promiseResults[endpoint] = result

      if (result.status !== 'fulfilled') {
        failureCount++
      }
    }

    // Remove the context from the DID document
    await this.account!.unlinkStorage(contextName)

    return promiseResults
  }

  public async getContextNameFromHash(contextHash: string, didDocument?: DIDDocument) {
    // Check user authenticated
    if (!this.account) {
      throw new Error('Account must be connected to get context name from hash')
    }

    // Get the DID document of this user
    if (!didDocument) {
      // @ts-ignore
      didDocument = <DIDDocument> await this.didClient.get(this.did!)
    }
    const services = didDocument.export().service!

    // Locate the endpoints for the given context hash
    const service = services.find((item) => item.id.match(contextHash) && item.type == 'VeridaDatabase')
    if (!service) {
      throw new Error(`Unable to locate service associated with context hash ${contextHash}`)
    }

    const timestamp = parseInt(((new Date()).getTime() / 1000.0).toString())
    const did = (await this.account!.did()).toLowerCase()

    // Loop through endpoints, hitting `/user/contextHash` until a response is received
    const endpoints: ServiceEndpoint[] = <ServiceEndpoint[]> service.serviceEndpoint
    for (let e in endpoints) {
      let endpointUri = endpoints[e]
      endpointUri = endpointUri.substring(0, endpointUri.length-1)  // strip trailing slash

      const consentMessage = `Obtain context hash (${contextHash}) for server: "${endpointUri}"?\n\n${did}\n${timestamp}`
      const signature = await this.account!.sign(consentMessage)

      try {
        const response = await Axios.post(`${endpointUri}/user/contextHash`, {
            did,
            timestamp,
            signature,
            contextHash
        });

        if (response.data.status == 'success') {
          return response.data.result.contextName
        }
      } catch (err) {
          // ignore errors, try another endpoint
      }
    }

    throw new Error(`Unable to access any endpoints associated with context hash ${contextHash}`)
  }

  /**
   * Get a Schama instance by URL.
   *
   * @param schemaUri URL of the schema
   * @returns Schema A schema object
   */
  public async getSchema(schemaUri: string): Promise<Schema> {
    return Schema.getSchema(schemaUri);
  }

  /**
   * Converts a string that may be either a valid DID or a valid Verida username into
   * a Verida username.
   * 
   * @param didOrUsername DID string or Verida username string (ending in `.vda`)
   * @returns 
   */
  public async parseDid(didOrUsername: string): Promise<string> {
    if (didOrUsername.match(/\.vda$/)) {
      // Have a Verida username. Perform on-chain lookup.
      // @throws Error if the username doesn't exist
      return await this.getDID(didOrUsername)
    }
    
    return didOrUsername
  }

  /**
   * Get the DID linked to a username
   * 
   * @param username 
   * @returns 
   */
  public async getDID(username: string): Promise<string> {
    return await this.nameClient.getDID(username)
  }

  /**
   * Get an array of usernames linked to a DID
   * 
   * @param did 
   * @returns 
   */
  public async getUsernames(did: string): Promise<string[]> {
    return await this.nameClient.getUsernames(did)
  }
}

export default Client;
