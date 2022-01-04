import { SecureContextConfig } from './interfaces';
import { DIDClient } from '@verida/did-client';
import { DIDDocument, Interfaces } from '@verida/did-document';
const Url = require('url-parse');

/**
 * Class representing the link between a DID and Storage context
 */
export default class StorageLink {
  // @todo: cache
  static async getLinks(didClient: DIDClient, did: string): Promise<SecureContextConfig[]> {
    if (!did) {
      return [];
    }

    const didDocument = await didClient.get(did);
    if (!didDocument) {
      return [];
    }

    return StorageLink.buildSecureContexts(didDocument);
  }

  /**
   *
   * @param ceramic
   * @param did
   * @param contextName
   * @returns SecureStorageContextConfig | undefined (if not found)
   */
  static async getLink(
    didClient: DIDClient,
    did: string,
    context: string,
    contextIsName: boolean = true
  ): Promise<SecureContextConfig | undefined> {
    let contextHash = context;
    if (contextIsName) {
      contextHash = DIDDocument.generateContextHash(did, context);
    }

    const secureContexts = await StorageLink.getLinks(didClient, did);
    const secureContext = StorageLink._findHash(secureContexts, contextHash);

    return secureContext;
  }

  /**
   *
   * @param ceramic
   * @param did
   * @param storageConfig (Must have .id as the contextName)
   */
  static async setLink(didClient: DIDClient, storageConfig: SecureContextConfig) {
    const did = didClient.getDid();
    if (!did) {
      throw new Error('DID client is not authenticated');
    }

    let didDocument = await didClient.get(did);

    // Create a new DID document if it doesn't already exist
    if (!didDocument) {
      didDocument = new DIDDocument(did, didClient.getPublicKey());
    } else {
      // Remove existing context if it exists
      const existing = await StorageLink.getLink(didClient, did, storageConfig.id);
      if (existing) {
        await StorageLink.unlink(didClient, storageConfig.id);
      }
    }

    // Build context hash in the correct format
    const contextHash = DIDDocument.generateContextHash(did, storageConfig.id);

    // Add services
    didDocument.addContextService(
      contextHash,
      Interfaces.EndpointType.DATABASE,
      storageConfig.services.databaseServer.type,
      storageConfig.services.databaseServer.endpointUri
    );
    didDocument.addContextService(
      contextHash,
      Interfaces.EndpointType.MESSAGING,
      storageConfig.services.messageServer.type,
      storageConfig.services.messageServer.endpointUri
    );

    if (storageConfig.services.storageServer) {
      didDocument.addContextService(
        contextHash,
        Interfaces.EndpointType.STORAGE,
        storageConfig.services.storageServer!.type,
        storageConfig.services.storageServer!.endpointUri
      );
    }

    if (storageConfig.services.notificationServer) {
      didDocument.addContextService(
        contextHash,
        Interfaces.EndpointType.NOTIFICATION,
        storageConfig.services.notificationServer!.type,
        storageConfig.services.notificationServer!.endpointUri
      );
    }

    // Add keys
    didDocument.addContextSignKey(contextHash, storageConfig.publicKeys.signKey.publicKeyHex);
    didDocument.addContextAsymKey(contextHash, storageConfig.publicKeys.asymKey.publicKeyHex);

    return await didClient.save(didDocument);
  }

  static async setContextService(
    didClient: DIDClient,
    contextName: string,
    endpointType: Interfaces.EndpointType,
    serverType: string,
    endpointUri: string
  ): Promise<boolean> {
    const did = didClient.getDid();
    if (!did) {
      throw new Error('DID client is not authenticated');
    }

    // Fetch existing DID document
    const didDocument = await didClient.get(did);
    if (!didDocument) {
      throw new Error(`DID Document doesn't exist for this context`);
    }

    // Build context hash in the correct format
    const contextHash = DIDDocument.generateContextHash(did, contextName);

    // Add the context service
    await didDocument.addContextService(contextHash, endpointType, serverType, endpointUri);

    return await didClient.save(didDocument);
  }

  static async unlink(didClient: DIDClient, contextName: string): Promise<boolean> {
    const did = didClient.getDid();
    if (!did) {
      throw new Error('DID Client is not authenticated');
    }

    const didDocument = await didClient.get(did);
    if (!didDocument) {
      return false;
    }

    const success = await didDocument!.removeContext(contextName);
    if (!success) {
      return false;
    }

    return await didClient.save(didDocument);
  }

  static _findHash(contexts: any[], hash: string): SecureContextConfig | undefined {
    for (let i in contexts) {
      if (contexts[i].id == hash) {
        return contexts[i];
      }
    }
  }

  static buildSecureContexts(didDocument: DIDDocument): SecureContextConfig[] {
    const doc: Interfaces.DIDDocumentStruct = didDocument.export();
    const did = doc.id;

    // strategy: loop through all signing keys as our way of looping through all contexts

    const contexts: SecureContextConfig[] = [];
    doc.assertionMethod?.map((value: any) => {
      const assertionParts = Url(value, true);
      if (!assertionParts.query || !assertionParts.query.context) {
        return;
      }

      const contextHash = assertionParts.query.context;

      // Get signing key
      const signKeyVerificationMethod = doc.verificationMethod!.find(
        (entry: any) => entry.id == `${did}?context=${contextHash}#sign`
      );
      if (!signKeyVerificationMethod) {
        return;
      }

      const signKey = signKeyVerificationMethod!.publicKeyHex;

      // Get asym key
      const asymKeyVerificationMethod = doc.verificationMethod!.find(
        (entry: any) => entry.id == `${did}?context=${contextHash}#asym`
      );
      if (!asymKeyVerificationMethod) {
        return;
      }

      const asymKey = asymKeyVerificationMethod!.publicKeyHex;

      // Get services
      const databaseService = doc.service!.find(
        (entry: any) => entry.id == `${did}?context=${contextHash}#database`
      );
      const messageService = doc.service!.find(
        (entry: any) => entry.id == `${did}?context=${contextHash}#messaging`
      );
      const storageService = doc.service!.find(
        (entry: any) => entry.id == `${did}?context=${contextHash}#storage`
      );
      const notificationService = doc.service!.find(
        (entry: any) => entry.id == `${did}?context=${contextHash}#notification`
      );

      // Valid we have everything
      if (!signKey || !asymKey || !databaseService || !messageService) {
        return;
      }

      // Build complete config
      const config: SecureContextConfig = {
        id: contextHash,
        publicKeys: {
          signKey: {
            type: 'EcdsaSecp256k1VerificationKey2019',
            publicKeyHex: signKey!,
          },
          asymKey: {
            type: 'Curve25519EncryptionPublicKey',
            publicKeyHex: asymKey!,
          },
        },
        services: {
          databaseServer: {
            type: databaseService!.type,
            endpointUri: databaseService!.serviceEndpoint,
          },
          messageServer: {
            type: messageService!.type,
            endpointUri: messageService!.serviceEndpoint,
          },
        },
      };

      if (storageService) {
        config.services.storageServer = {
          type: storageService!.type,
          endpointUri: storageService!.serviceEndpoint,
        };
      }

      if (notificationService) {
        config.services.notificationServer = {
          type: notificationService!.type,
          endpointUri: notificationService!.serviceEndpoint,
        };
      }

      contexts.push(config);
    });

    return contexts;
  }
}
