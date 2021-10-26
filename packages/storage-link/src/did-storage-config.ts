import { SecureContextConfig, SecureContextServices } from './interfaces'

export default class DIDStorageConfig {

    /**
     * Generate a storage link for an existing DID
     * 
     * @todo: Update `account` to specify `AccountInterface` (once moved into its own package)
     * 
     * @param did 
     * @param contextName 
     */
    static async generate(account: any, contextName: string, servicesConfig: SecureContextServices): Promise<SecureContextConfig> {
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
                    type: 'EcdsaSecp256k1VerificationKey2019',
                    base58: publicKeys.signPublicKeyBase58
                }
            },
            services: servicesConfig
        }

        return config
    }

}