import { Keyring } from "@verida/storage-keyring"
import { AuthenticatorInterface } from "@verida/authenticator"
import { SecureStorageContextConfig, SecureStorageContextServices } from "./interfaces"

export default class DIDStorageConfig {

    /**
     * Generate a storage link for an existing DID
     * 
     * @param did 
     * @param contextName 
     */
    static async generate(authenticator: AuthenticatorInterface, contextName: string, servicesConfig: SecureStorageContextServices): Promise<SecureStorageContextConfig> {
        const consentMessage = `Do you wish to unlock this storage context: "${contextName}"?`
        const sig = await authenticator.sign(consentMessage)
        const keyring = new Keyring(sig)
        const publicKeys = await keyring.publicKeys()

        const config: SecureStorageContextConfig = {
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