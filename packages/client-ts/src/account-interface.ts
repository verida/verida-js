import { Interfaces } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'

/**
 * Interface representing an authenticated account on the Verida network.
 * 
 * This interface should be extended to provide the necessary UI to request
 * permission for a user to sign a consent message. It should also provide the
 * DID of the current authenticated user.
 */
export default interface AccountInterface {

    /**
     * Generate a keyring for this user for a given storage context.
     * 
     * @param contextName 
     */
    keyring(contextName: string): Promise<Keyring>

    /**
     * Sign a string as the current user
     * 
     * @param input 
     */
    sign(input: string): Promise<string>

    /**
     * Get the DID of the current user
     */
    did(): Promise<string>

    /**
     * Link storage to this user
     * 
     * @param storageConfig 
     */
    linkStorage(storageConfig: Interfaces.SecureContextConfig): Promise<void>

    /**
     * Unlink storage for this user
     * 
     * @param contextName 
     */
    unlinkStorage(contextName: string): Promise<boolean>

}