import { SecureContextEndpoint } from "./DocumentInterfaces";
import { IAccount } from "./IAccount";
import { IDIDClient } from "./IDIDClient";
import { SecureContextConfig } from "./StorageLinkInterfaces";

export interface DIDContextManager {
   constructor(didClient: IDIDClient): void

   setAccount(account: IAccount): void

    getContextDatabaseServer(
    did: string,
    contextName: string,
    forceCreate: boolean
  ): Promise<SecureContextEndpoint> 

    getContextStorageServer(
    did: string,
    contextName: string,
    forceCreate: boolean
  ): Promise<SecureContextEndpoint> 

    getContextMessageServer(
    did: string,
    contextName: string,
    forceCreate: boolean
  ): Promise<SecureContextEndpoint> 

    getDIDContextHashConfig(did: string, contextHash: string): Promise<SecureContextConfig>

    getDIDContextConfig(
        did: string,
        contextName: string,
        forceCreate?: boolean
    ): Promise<SecureContextConfig> 
}

