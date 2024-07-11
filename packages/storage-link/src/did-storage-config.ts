import { SecureContextConfig, SecureContextServices } from "@verida/types"

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

        const config: SecureContextConfig = {
            id: contextName,
            publicKeys: {
                asymKey: {
                    type: 'Curve25519EncryptionPublicKey',
                    publicKeyHex: publicKeys.asymPublicKeyHex
                },
                signKey: {
                    type: 'EcdsaSecp256k1VerificationKey2019',
                    publicKeyHex: publicKeys.signPublicKeyHex
                }
            },
            services: servicesConfig,
            isLegacyDid: false
        }

        return config
    }

}