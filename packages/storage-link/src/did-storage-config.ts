import { AccountInterface } from '@verida/account'
import { SecureContextConfig, SecureContextServices } from './interfaces'
import { StorageLink } from './index'

export default class DIDStorageConfig {

    /**
     * Generate a storage link for an existing DID
     * 
     * @param did 
     * @param contextName 
     */
    static async generate(account: AccountInterface, contextName: string, servicesConfig: SecureContextServices): Promise<SecureContextConfig> {
        const keyring = await account.keyring(contextName)
        const publicKeys = await keyring.publicKeys()
        const did = await account.did()

        const config: SecureContextConfig = {
            id: contextName,
            publicKeys: {
                asymKey: {
                    type: 'Curve25519EncryptionPublicKey',
                    base58: publicKeys.asymPublicKeyBase58
                },
                signKey: {
                    type: 'ED25519SignatureVerification',
                    base58: publicKeys.signPublicKeyBase58
                }
            },
            services: servicesConfig
        }

        return config
    }

}