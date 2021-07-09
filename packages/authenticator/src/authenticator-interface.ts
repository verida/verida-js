
/**
 * Interface representing an Authentication service.
 * 
 * This interface should be extended to provide the necessary UI to request
 * permission for a user to sign a consent message. It should also provide the
 * DID of the current authenticated user.
 */
export default interface AuthenticatorInterface {

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

}