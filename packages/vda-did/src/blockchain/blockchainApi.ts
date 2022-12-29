import { getVeridaSignWithNonce, interpretIdentifier } from "./helpers"
import { VdaDidConfigurationOptions } from "../interfaces"
import {getContractInfoForNetwork} from "./config"
import { getVeridaContract, VeridaContract } from "@verida/web3"
import { ethers } from "ethers"

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

        const { address, publicKey, network } = interpretIdentifier(options.identifier)
        
        this.didAddress = address.toLowerCase();
        // @ts-ignore
        this.network = network || options.chainNameOrId
        const contractInfo = getContractInfoForNetwork(this.network);

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
     * @param did DID address
     * @param endpoints Array of endpoints to be registered
     * @param signKey Verida account key to generate signature
     * @returns Signature
     */
    private async getRegisterSignature (
        did: string,
        endpoints: string[],
        signKey: string
    ) {
        let rawMsg = ethers.utils.solidityPack(['address', 'string'], [did.toLowerCase(), '/']);
        const nonce = await this.nonceFN()
        
        for (let i = 0; i < endpoints.length; i++) {
            rawMsg = ethers.utils.solidityPack(
            ['bytes', 'string', 'string'],
            [rawMsg, endpoints[i], '/']
            );
        }

        return await getVeridaSignWithNonce(rawMsg, signKey, nonce);
    };

    /**
     * Register endpoints to blockchain
     * @param endpoints Array of endpoints to be registered
     */
    public async register(endpoints: string[]) {
        if (!this.options.signKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }

        const signature = await this.getRegisterSignature(this.didAddress, endpoints, this.options.signKey);
        const response = await this.vdaWeb3Client.register(this.didAddress, endpoints, signature);

        if (response.success !== true) {
            throw new Error('Failed to register endpoints');
        }
    }

    /**
     * Get a signature for {@link BlockchainApi#setController} function
     * @param did DID address
     * @param controller DID address of controller that will be set
     * @param signKey Private key of original controller of `did`
     * @returns Signature
     */
    private async getControllerSignature(
        did: string,
        controller: string,
        signKey: string
    ){
        const rawMsg = ethers.utils.solidityPack(
            ['address', 'string', 'address', 'string'],
            [did, '/setController/', controller, '/']
        );
        return await getVeridaSignWithNonce(rawMsg, signKey, await this.nonceFN());
    };

    /**
     * Set a controller of the {@link BlockchainApi#didAddress} to the blockchain
     * @param controllerPrivateKey private key of new controller
     */
    public async setController(controllerPrivateKey: string) {
        if (!this.options.signKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }

        const controllerAddress = ethers.utils.computeAddress(controllerPrivateKey).toLowerCase();

        const signature = await this.getControllerSignature(this.didAddress, controllerAddress, this.options.signKey);
        const response = await this.vdaWeb3Client.setController(this.didAddress, controllerAddress, signature);

        if (response.success !== true) {
            throw new Error('Failed to set controller');
        }

        this.options.signKey = controllerPrivateKey;
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
     * @param did DID address
     * @param signKey Private key of original controller of `did`
     * @returns Signature
     */
    private async getRevokeSignature(did: string, signKey: string) {
        const rawMsg = ethers.utils.solidityPack(
            ['address', 'string'],
            [did.toLowerCase(), '/revoke/']
        );
        return await getVeridaSignWithNonce(rawMsg, signKey, await this.nonceFN());
    };

    /**
     * Revoke a DID address from the blockchain
     */
    public async revoke() {
        if (!this.options.signKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        
        const signature = await this.getRevokeSignature(this.didAddress, this.options.signKey);
        const response = await this.vdaWeb3Client.revoke(this.didAddress, signature);
        if (response.success !== true) {
            throw new Error('Failed to revoke');
        }
    }

}