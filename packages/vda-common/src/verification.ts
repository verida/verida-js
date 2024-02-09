/**
 * Common functions to mange trustedSigners
 */
class VdaVerificationUtilsClass {
    protected readOnly: any;
    protected config: any;
    protected vdaWeb3Client: any;
    protected contract: any;

    /**
     * Add a trusted signer
     * @param didAddress DID address to be added
     */
    public async addTrustedSigner(didAddress: string) {

        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const response = await this.vdaWeb3Client.addTrustedSigner(didAddress);
        
        if (response.success !== true) {
            throw new Error(`Failed to add a trusted signer: ${response.reason}`);
        }
    }

    /**
     * Remove a trusted signer
     * @param didAddress DID address to be added
     */
    public async removeTrustedSigner(
        didAddress: string
    ) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const response = await this.vdaWeb3Client!.removeTrustedSigner(didAddress);
        
        if (response.success !== true) {
            throw new Error(`Failed to remove a trusted signer: ${response.reason}`);
        }
    }

    /**
     * Check whether given address is a trusted signer
     * @param didAddress DID address to be checked
     * @returns true if trusted signer, otherwise false
     */
    public async isTrustedSigner(didAddress: string) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.isTrustedSigner(didAddress);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.isTrustedSigner(didAddress);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to check trusted signer (${message})`);
        }
    }
}

export const VdaVerificationUtils = new VdaVerificationUtilsClass();