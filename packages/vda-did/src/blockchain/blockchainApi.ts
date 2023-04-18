import { interpretIdentifier, getContractInfoForNetwork } from "@verida/vda-common"
import { getVeridaSignWithNonce } from "./helpers"
import { VdaDidConfigurationOptions } from "@verida/types"
import { getVeridaContract, VeridaContract } from "@verida/web3"
import { ethers } from "ethers"
import EncryptionUtils from "@verida/encryption-utils"

export interface LookupResponse {
    didController: string
    endpoints: string[]
}

export default class BlockchainApi {

    private options: VdaDidConfigurationOptions
    private network: string
    private didAddress : string

    private vdaWeb3Client : VeridaContract;

    constructor(options: VdaDidConfigurationOptions) {
        this.options = options

        if (!this.options.signKey && !this.options.signer) {
            throw new Error(`Invalid configuration. 'signKey' or 'signer' must be specified`)
        }

        if (this.options.signKey && !this.options.signer) {
            this.options.signer = (data: any) => {
                const privateKeyArray = new Uint8Array(
                    Buffer.from(options.signKey!.slice(2), 'hex')
                );
                return Promise.resolve(EncryptionUtils.signData(data, privateKeyArray))
            }
        }

        const { address, publicKey, network } = interpretIdentifier(options.identifier)
        
        this.didAddress = address.toLowerCase();
        // @ts-ignore
        this.network = network || options.chainNameOrId
        const contractInfo = getContractInfoForNetwork( "DidRegistry", this.network);

        // @ts-ignore
        if (options.callType == 'web3' && !options.web3Options.rpcUrl) {
            throw new Error('Web3 transactions must specify `rpcUrl` in the configuration options')
        }

        this.vdaWeb3Client = getVeridaContract(
            options.callType, 
            {...contractInfo,
            ...options.web3Options});
    }

    /**
     * Get a nonce from DIDRegistry contract
     * @returns nonce of DID
     */
    public async nonceFN() {
        const response = await this.vdaWeb3Client.nonce(this.didAddress);
        if (response.data === undefined) {
            throw new Error('Error in getting nonce');
        }
        return response.data;
    }

    /**
     * Get a controller & Endpoints' array of a DID address fro blockchain
     * @returns Controller & Endpoints array
     */
    public async lookup(did: string): Promise<LookupResponse> {
        // @todo: Fetch actual on chain values
        const didParts = interpretIdentifier(did)

        const response = await this.vdaWeb3Client.lookup(didParts.address.toLowerCase());
        if (response.success !== true) {
            throw new Error('DID not found');
        }

        return {
            didController: response.data[0],
            endpoints: response.data[1]
        }
    }

    /**
     * Get a signature for {@link BlockchainApi#register} function
     * @param endpoints Array of endpoints to be registered
     * @returns Signature
     */
    private async getRegisterSignature (
        endpoints: string[]
    ) {
        let rawMsg = ethers.utils.solidityPack(['address', 'string'], [this.didAddress.toLowerCase(), '/']);
        const nonce = await this.nonceFN()
        
        for (let i = 0; i < endpoints.length; i++) {
            rawMsg = ethers.utils.solidityPack(
            ['bytes', 'string', 'string'],
            [rawMsg, endpoints[i], '/']
            );
        }

        return await getVeridaSignWithNonce(rawMsg, this.options.signer!, nonce);
    };

    /**
     * Register endpoints to blockchain
     * @param endpoints Array of endpoints to be registered
     */
    public async register(endpoints: string[]) {
        if (!this.options.signer) {
            throw new Error(`Unable to create DID. No signer specified in config.`)
        }

        const signature = await this.getRegisterSignature(endpoints);
        const response = await this.vdaWeb3Client.register(this.didAddress, endpoints, signature);

        if (response.success !== true) {
            throw new Error('Failed to register endpoints');
        }
    }

    /**
     * Get a signature for {@link BlockchainApi#setController} function
     * @param controller DID address of controller that will be set
     * @returns Signature
     */
    private async getControllerSignature(
        controller: string
    ){
        const rawMsg = ethers.utils.solidityPack(
            ['address', 'string', 'address', 'string'],
            [this.didAddress, '/setController/', controller, '/']
        );
        return await getVeridaSignWithNonce(rawMsg, this.options.signer!, await this.nonceFN());
    };

    /**
     * Set a controller of the {@link BlockchainApi#didAddress} to the blockchain
     * @param controllerPrivateKey private key of new controller
     */
    public async setController(controllerPrivateKey: string) {
        if (!this.options.signer) {
            throw new Error(`Unable to create DID. No signer specified in config.`)
        }

        const controllerAddress = ethers.utils.computeAddress(controllerPrivateKey).toLowerCase();

        const signature = await this.getControllerSignature(controllerAddress);
        const response = await this.vdaWeb3Client.setController(this.didAddress, controllerAddress, signature);

        if (response.success !== true) {
            throw new Error('Failed to set controller');
        }

        this.options.signer = (data: any) => {
            const privateKeyArray = new Uint8Array(
                Buffer.from(controllerPrivateKey.slice(2), 'hex')
            );
            return Promise.resolve(EncryptionUtils.signData(data, privateKeyArray))
        }
    }

    public async getController() {
        const response = await this.vdaWeb3Client.getController(this.didAddress);

        if (response.success !== true) {
            throw new Error('Failed to get controller');
        }

        return response.data;
    }

    /**
     * Get a signature for {@link BlockchainApi#revoke} function
     * @returns Signature
     */
    private async getRevokeSignature() {
        const rawMsg = ethers.utils.solidityPack(
            ['address', 'string'],
            [this.didAddress.toLowerCase(), '/revoke/']
        );
        return await getVeridaSignWithNonce(rawMsg, this.options.signer!, await this.nonceFN());
    };

    /**
     * Revoke a DID address from the blockchain
     */
    public async revoke() {
        if (!this.options.signer) {
            throw new Error(`Unable to create DID. No signer specified in config.`)
        }
        
        const signature = await this.getRevokeSignature();
        const response = await this.vdaWeb3Client.revoke(this.didAddress, signature);
        if (response.success !== true) {
            throw new Error('Failed to revoke');
        }
    }

}