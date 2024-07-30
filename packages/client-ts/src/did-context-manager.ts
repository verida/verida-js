import { StorageLink } from "@verida/storage-link";
import { DIDClient } from "@verida/did-client";
import { IAccount, DIDContextConfigs, SecureContextEndpoint, SecureContextConfig } from "@verida/types";
import { DIDDocument } from "@verida/did-document";
import { Network } from "@verida/types";

/**
 * Manage all the available storage contexts for all the DIDs being requested,
 *
 * Can force creating a new storage context for the authenticated account.
 */

/**
 * @category
 * Modules
 */
class DIDContextManager {
  private didContexts: DIDContextConfigs = {};

  private didClient: DIDClient;
  private network: Network
  private account?: IAccount;

  public constructor(network: Network, didClient: DIDClient) {
    this.network = network
    this.didClient = didClient;
  }

  public setAccount(account: IAccount) {
    this.account = account;
  }

  public async getContextDatabaseServer(
    did: string,
    contextName: string,
    forceCreate: boolean = true
  ): Promise<SecureContextEndpoint> {
    const contextConfig = await this.getDIDContextConfig(
      did,
      contextName,
      forceCreate
    );
    return contextConfig.services.databaseServer;
  }

  public async getContextStorageServer(
    did: string,
    contextName: string,
    forceCreate: boolean = true
  ): Promise<SecureContextEndpoint> {
    const contextConfig = await this.getDIDContextConfig(
      did,
      contextName,
      forceCreate
    );
    if (!contextConfig.services.storageServer) {
      throw new Error("Storage server not specified");
    }

    return contextConfig.services.storageServer;
  }

  public async getContextMessageServer(
    did: string,
    contextName: string,
    forceCreate: boolean = true
  ): Promise<SecureContextEndpoint> {
    const contextConfig = await this.getDIDContextConfig(
      did,
      contextName,
      forceCreate
    );
    return contextConfig.services.messageServer;
  }

  public async getDIDContextHashConfig(did: string, contextHash: string) {
    if (this.didContexts[contextHash]) {
      return this.didContexts[contextHash];
    }

    let storageConfig = await StorageLink.getLink(
      this.network,
      this.didClient,
      did,
      contextHash,
      false
    );
    if (!storageConfig) {
      throw new Error(
        "Unable to locate requested storage context for this user"
      );
    }

    this.didContexts[contextHash] = storageConfig;
    return storageConfig;
  }

  public async getDIDContextConfig(
    did: string,
    contextName: string,
    forceCreate?: boolean
  ): Promise<SecureContextConfig> {
    let contextHash
    if (contextName.substring(0, 2) == '0x') {
      contextHash = contextName;
    }
    else {
      contextHash = DIDDocument.generateContextHash(did, contextName);
    }

    if (this.didContexts[contextHash]) {
      return this.didContexts[contextHash];
    }

    let storageConfig;
    // Fetch the storage config from our account object if it matches the requested DID
    if (this.account) {
      const accountDid = await this.account.did();
      if (accountDid == did) {
        try {
          //const now = (new Date()).getTime()
          storageConfig = await this.account.storageConfig(
            contextName,
            forceCreate!
          );

          // If we have a legacy DID then we need to update the context hash
          // to use `did:vda:mainnet`
          if (storageConfig?.isLegacyDid) {
            did = await this.account.did()

            if (contextName.substring(0, 2) != '0x') {
              contextHash = DIDDocument.generateContextHash(did, contextName);
            }
          }
          //console.log(`getDIDContextConfig(${did}, ${contextName}): ${(new Date()).getTime()-now}`)
        } catch (err: any) {
          throw new Error(`Unable to locate requested storage context (${contextName}) for this DID (${did}): ${err.message}`)
          // account may not support context
          // @todo: create error instance for this specific type of error
        }
      }
    }

    if (!storageConfig) {
      storageConfig = await StorageLink.getLink(
        this.network,
        this.didClient,
        did,
        contextName,
        true
      );

      // If we have a legacy DID then we need to update the context hash
      // to use `did:vda:mainnet`
      if (storageConfig?.isLegacyDid) {
        if (contextName.substring(0, 2) != '0x') {
          did = did.replace('polpos', 'mainnet')
          contextHash = DIDDocument.generateContextHash(did, contextName);
        }
      }
    }

    if (!storageConfig) {
      if (forceCreate) {
        throw new Error(
          "Unable to force creation of storage context for this DID"
        );
      } else {
        throw new Error(
          `Unable to locate requested storage context (${contextName}) for this DID (${did}) -- Storage context doesn\'t exist (try force create?)`
        );
      }
    }

    this.didContexts[contextHash] = storageConfig;
    return storageConfig;
  }
}

export default DIDContextManager;
