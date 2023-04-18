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

  setAccountConfig(accountConfig: AccountConfig): void

  createDidJwt(contextName: string, data: object, config: any): Promise<string>

  disconnect(contextName?: string): Promise<void> 

  getAuthContext(contextName: string, contextConfig: SecureContextConfig, authConfig?: AuthTypeConfig, authType?: string): Promise<AuthContext>

  disconnectDevice(contextName: string, deviceId: string): Promise<boolean> 
}