import { AccountConfig, AuthContext, AuthTypeConfig } from './AccountInterfaces'
import { IDIDClient } from './IDIDClient'
import { IKeyring } from './IKeyring'
import { SecureContextConfig } from './StorageLinkInterfaces'

export interface IAccount {
    keyring(contextName: string): Promise<IKeyring>

    sign(input: string): Promise<string>

    did(): Promise<string>
    
    linkStorage(storageConfig: SecureContextConfig): Promise<boolean>
    
    unlinkStorage(contextName: string): Promise<boolean>
    
    storageConfig(contextName: string, forceCreate: boolean): Promise<SecureContextConfig | undefined>
    

    linkStorageContextService(contextName: string, endpointType: string, serverType: string, endpointUris: string[]): Promise<boolean>
    
    getDidClient(): Promise<IDIDClient>

     setAccountConfig(accountConfig: AccountConfig): void
    

    /**
     * Create a DID-JWT from a data object
     * @param {*} data 
     */
       createDidJwt(contextName: string, data: object, config: any): Promise<string>
     

    /**
     * An optional method that can be used to disconnect the current user.
     * 
     * For example, in a web browser context, it would remove any stored signatures from local storage.
     */
      disconnect(contextName?: string): Promise<void> 
    

      getAuthContext(contextName: string, contextConfig: SecureContextConfig, authConfig: AuthTypeConfig, authType: string): Promise<AuthContext>
    

      disconnectDevice(contextName: string, deviceId: string): Promise<boolean> 
    

}