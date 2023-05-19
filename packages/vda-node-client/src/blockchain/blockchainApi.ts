import {
    getVeridaContract,
    VeridaContract
} from "@verida/web3"
import { VdaClientConfig, Web3SelfTransactionConfig } from '@verida/types'
import { ethers, Contract, BigNumberish, BytesLike } from "ethers";
import { getContractInfoForNetwork, RPC_URLS, getVeridaSignWithNonce } from "@verida/vda-common";
import { JsonRpcProvider } from '@ethersproject/providers';
import { explodeDID } from '@verida/helpers';
import EncryptionUtils from "@verida/encryption-utils";

export interface IStorageNode {
    didAddress: string;
    endpointUri: string;
    countryCode: string;
    regionCode: string;
    datacenterId: BigNumberish;
    lat: number;
    long: number;
    establishmentDate: string;
    status?: string;
}

export class VeridaNodeClient {

    private config: VdaClientConfig
    private network: string
    private didAddress?: string

    private vdaWeb3Client? : VeridaContract

    private readOnly: boolean
    private contract?: ethers.Contract

    private CONTRACT_DECIMAL?: number
    
    public constructor(config: VdaClientConfig) {
        if (!config.callType) {
            config.callType = 'web3'
        }

        this.config = config
        this.readOnly = true
        if (!config.web3Options) {
            config.web3Options = {}
        }

        this.network = config.network

        if (config.callType == 'web3' && !(<Web3SelfTransactionConfig>config.web3Options).rpcUrl) {
            (<Web3SelfTransactionConfig> config.web3Options).rpcUrl = <string> RPC_URLS[this.network]
        }

        const contractInfo = getContractInfoForNetwork("StorageNodeRegistry", this.network)

        if (config.did) {
            this.readOnly = false
            const { address } = explodeDID(config.did)
            this.didAddress = address.toLowerCase()
            
            this.vdaWeb3Client = getVeridaContract(
                config.callType, 
                {...contractInfo,
                ...config.web3Options})
        } else {
            let rpcUrl = (<Web3SelfTransactionConfig>config.web3Options).rpcUrl
            if (!rpcUrl) {
                rpcUrl = <string> RPC_URLS[this.network]
            }

            const provider = new JsonRpcProvider(rpcUrl)

            this.contract = new Contract(contractInfo.address, contractInfo.abi.abi, provider)
        }
    }

    /**
     * Get a nonce from contract
     * @returns nonce of DID
     */
    public async nonceFN() {
        if (!this.vdaWeb3Client) {
            throw new Error(`Config must specify 'did' or 'signKey'`)
        }

        const response = await this.vdaWeb3Client.nonce(this.didAddress);
        if (response.data === undefined) {
            throw new Error('Error in getting nonce');
        }
        return response.data;
    }

    /**
     * Get DECIMAL of contract
     * @returns DECIMAL of contract
     */
    public async getContractDecimal() {
        if (!this.CONTRACT_DECIMAL) {
            let response;
            try {
                if (this.vdaWeb3Client) {
                    response = await this.vdaWeb3Client.DECIMAL();
                    if (response.success !== true) {
                        throw new Error(response.reason);
                    }

                    this.CONTRACT_DECIMAL = Number(response.data);
                } else {
                    response = await this.contract!.callStatic.DECIMAL();

                    this.CONTRACT_DECIMAL = Number(response);
                }
            } catch (err:any ) {
                const message = err.reason ? err.reason : err.message;
                throw new Error(`Failed to get datacenters by country (${message})`);
            }
        }

        return this.CONTRACT_DECIMAL!
    }

    /**
     * Return an array of `Datacenter` structs for given array of datacenterIds
     * @param ids Array of datacenterIds
     * @returns Array of Datacenters
     */
    public async getDataCenters(ids: number[]) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getDatacenters(ids);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.getDatacenters(ids);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get datacenters (${message})`);
        }
    }

    /**
     * Return an array of `Datacenter` structs for country code
     * @param countryCode Unique two-character string code
     * @returns Array of Datacenters
     */
    public async getDataCentersByCountry(countryCode: string) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getDataCentersByCountry(countryCode);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.getDataCentersByCountry(countryCode);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get datacenters by country (${message})`);
        }
    }

    /**
     * Return an array of `Datacenter` structs for region code
     * @param regionCode Unique region string code
     * @returns Array of Datacenters
     */
    public async getDataCentersByRegion(regionCode: string) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getDataCentersByRegion(regionCode);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.getDataCentersByRegion(regionCode);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get datacenters by region (${message})`);
        }
    }

    /**
     * 
     * @param endpointUri The storage node endpoint
     * @param countryCode Unique two-character string code
     * @param regionCode Unique region string code
     * @param datacenterId Unique datacenter identifier registered by contract owner
     * @param lat Latitude
     * @param long Longitude
     * @param authSignature Signature signed by a trusted signer
     */
    public async addNode(
        endpointUri: string,
        countryCode: string,
        regionCode: string,
        datacenterId: BigNumberish,
        latVal: number,
        longVal: number,
        authSignature: BytesLike
    ) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const privateKeyArray = new Uint8Array(
            Buffer.from(this.config.signKey.slice(2), "hex")
        );

        const decimal = await this.getContractDecimal();

        const lat = ethers.utils.parseUnits(latVal.toString(), decimal);
        const long = ethers.utils.parseUnits(longVal.toString(), decimal);


        // Sign the blockchain request as this DID
        const nonce = await this.nonceFN();
        const requestMsg = ethers.utils.solidityPack(
            ["address", "string", "uint", "int", "int", "uint"],
            [this.didAddress, `${endpointUri}${countryCode}${regionCode}`, datacenterId, lat, long, nonce]
        );
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray);

        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase();
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray);

        const response = await this.vdaWeb3Client!.addNode(
            {
                didAddress: this.didAddress,
                endpointUri,
                countryCode,
                regionCode,
                datacenterId,
                lat,
                long,
            },
            requestSignature,
            requestProof,
            authSignature
        );

        if (response.success !== true) {
            throw new Error(`Failed to add node: ${response.reason}`);
        }
    }

    /**
     * Unregister a storage node from the network at the specified date
     * @param unregisterDateTime The unix timestamp in secods of when the storage node should no logner be available for selection.
        Must be at leaset 28 dayse in the future from calling function point
     */
    public async removeNodeStart(unregisterDateTime: number) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const privateKeyArray = new Uint8Array(
            Buffer.from(this.config.signKey.slice(2), "hex")
        );

        // Sign the blockchain request as this DID
        const nonce = await this.nonceFN();
        const requestMsg = ethers.utils.solidityPack(
            ["address", "uint", "uint"],
            [this.didAddress, unregisterDateTime, nonce]
        );
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray);

        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase();
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray);

        const response = await this.vdaWeb3Client!.removeNodeStart(
            this.didAddress,
            unregisterDateTime,
            requestSignature,
            requestProof
        );

        if (response.success !== true) {
            throw new Error(`Failed to remove node start: ${response.reason}`);
        }
    }

    /**
     * Complete storage node unregisteration
     */
    public async removeNodeComplete() {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const privateKeyArray = new Uint8Array(
            Buffer.from(this.config.signKey.slice(2), "hex")
        );

        // Sign the blockchain request as this DID
        const nonce = await this.nonceFN();
        const requestMsg = ethers.utils.solidityPack(
            ["address", "uint"],
            [this.didAddress, nonce]
        );
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray);

        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase();
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray);

        const response = await this.vdaWeb3Client!.removeNodeComplete(
            this.didAddress,
            requestSignature,
            requestProof
        );

        if (response.success !== true) {
            throw new Error(`Failed to remove node complete: ${response.reason}`);
        }
    }

    private async standardizeNode(data: any, status?: string) : Promise<IStorageNode> {
        const decimal = await this.getContractDecimal();
        const establishmentDate = new Date(data.establishmentDate.toNumber() * 1000);

        const result: IStorageNode = {
            didAddress: data.didAddress,
            endpointUri: data.endpointUri,
            countryCode: data.countryCode,
            regionCode: data.regionCode,
            datacenterId: data.datacenterId.toNumber(),
            lat: Number(ethers.utils.formatUnits(data.lat, decimal)),
            long: Number(ethers.utils.formatUnits(data.long, decimal)),
            establishmentDate: establishmentDate.toLocaleString()
        };

        if (status !== undefined) {
            result.status = status!;
        }

        return result;
    }

    /**
     * Returns a storage node for didAddress
     * @param didAddress DID address that is associated with the storage node
     * @returns Storage node
     */
    public async getNodeByAddress(didAddress = this.didAddress) {
        if (this.readOnly && !didAddress) {
            throw new Error(`Need didAddress in read only mode`)
        }

        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getNodeByAddress(didAddress);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return await this.standardizeNode(response.data[0], response.data[1])
            } else {
                response = await this.contract!.callStatic.getNodeByAddress(didAddress);
                return await this.standardizeNode(response[0], response[1]);
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get node by address (${message})`);
        }
    }

    /**
     * Returns a storage node for didAddress
     * @param endpointUri The storage node endpoint
     * @returns Storage node
     */
    public async getNodeByEndpoint(endpintUri: string) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getNodeByEndpoint(endpintUri);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return await this.standardizeNode(response.data[0], response.data[1])
            } else {
                response = await this.contract!.callStatic.getNodeByEndpoint(endpintUri);

                return await this.standardizeNode(response[0], response[1]);
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get node by endpoint (${message})`);
        }
    }

    /**
     * Return an array of `Storagenode` structs for country code
     * @param countryCode Unique two-character string code
     * @returns An array of `Storagenode` structs
     */
    public async getNodesByCountry(countryCode: string) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getNodesByCountry(countryCode);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return await Promise.all(
                    response.data.map(async (item: any) => await this.standardizeNode(item))
                );
            } else {
                response = await this.contract!.callStatic.getNodesByCountry(countryCode);
                return await Promise.all(
                    response.map(async (item: any) => await this.standardizeNode(item))
                );
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get nodes by country (${message})`);
        }
    }

    /**
     * Return an array of `Storagenode` structs for region code
     * @param regionCode Unique region string code
     * @returns An array of `Storagenode` structs
     */
    public async getNodesByRegion(regionCode: string) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getNodesByRegion(regionCode);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return await Promise.all(
                    response.data.map(async (item: any) => await this.standardizeNode(item))
                );
            } else {
                response = await this.contract!.callStatic.getNodesByRegion(regionCode);

                return await Promise.all(
                    response.map(async (item: any) => await this.standardizeNode(item))
                );
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get nodes by region (${message})`);
        }
    }
}