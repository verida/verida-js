import { IAccount } from "./IAccount";
import { IContext } from "./IContext";
import { IProfile } from "./IProfile";
import { ISchema } from "./ISchema";
import { SecureContextConfig } from "./StorageLinkInterfaces";

export interface IClient {
    connect(account: IAccount): Promise<void>

    isConnected(): void

    openContext(
        contextName: string,
        forceCreate: boolean
    ): Promise<IContext | undefined>

    openExternalContext(contextName: string, did: string): Promise<IContext>

    getContextConfig(
        did: string,
        contextName: string
    ): Promise<SecureContextConfig | undefined> 

    openPublicProfile(
        did: string,
        contextName: string,
        profileName: string,
        fallbackContext: string | null
    ): Promise<IProfile | undefined>

    getValidDataSignatures(
        data: any,
        did?: string
    ): Promise<string[]>

    getSchema(schemaUri: string): Promise<ISchema>
}