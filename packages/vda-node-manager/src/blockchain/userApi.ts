import {
    getVeridaContract,
    VeridaContract
} from "@verida/web3";
import { VdaClientConfig, Web3SelfTransactionConfig, EnumStatus } from '@verida/types'
import { ethers, Contract, BigNumberish, BytesLike } from "ethers";
import { getContractInfoForNetwork, RPC_URLS, getVeridaSignWithNonce } from "@verida/vda-common";
import { JsonRpcProvider } from '@ethersproject/providers';
import { explodeDID } from '@verida/helpers';
import EncryptionUtils from "@verida/encryption-utils";

export interface IStorageNode {
    name: string;
    didAddress: string;
    endpointUri: string;
    countryCode: string;
    regionCode: string;
    datacentreId: BigNumberish;
    lat: number;
    long: number;
    slotCount: BigNumberish,
    establishmentDate: string;
    acceptFallbackSlots: boolean;
    status: EnumStatus;
    unregisterTime?: string;
    fallbackNodeAddress?: string;
}

export interface IFallbackNodeInfo {
    fallbackNodeAddress: string;
    availableSlots: BigNumberish;
    fallbackProofTime: BigNumberish;
    availableSlotsProof: BytesLike;
}


export class VeridaNodeManager {

    protected config: VdaClientConfig
    protected network: string
    protected didAddress?: string

    protected vdaWeb3Client? : VeridaContract

    protected readOnly: boolean
    protected contract?: ethers.Contract

    protected CONTRACT_DECIMAL?: number
    
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
                throw new Error(`Failed to get datacentres by country (${message})`);
            }
        }

        return this.CONTRACT_DECIMAL!
    }

    /**
     * Get Verida Token address that is associated with `StorageNodeRegistry` contract
     * @returns Verida token address
     */
    public async getVDATokenAddress() {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getVDATokenAddress();
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.getVDATokenAddress();

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get Verida Token address (${message})`);
        }
    }

    /**
     * Check whether data centre name is registered before
     * @param name Datacentre name to be checked
     * @returns `true` if datacentre name exist, otherwise `false`
     */
    public async isRegisteredDataCentreName(name: string): Promise<boolean> {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.isRegisteredDataCentreName(name);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.isRegisteredDataCentreName(name);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to check datacentre name (${message})`);
        }
    }

    /**
     * Return an array of `Datacentre` structs for given array of datacentreIds
     * @param ids Array of datacentreIds
     * @returns Array of Datacentres
     */
    public async getDataCentresById(ids: BigNumberish[]) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getDataCentresById(ids);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.getDataCentresById(ids);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get datacentres (${message})`);
        }
    }

    /**
     * Return a `Datacentre` struct matched to the given name
     * @param names Array of datacentre name
     * @returns `undefined` if not exist
     */
    public async getDataCentresByName(names: string[]) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getDataCentresByName(names);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.getDataCentresByName(names);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get datacentres by name (${message})`);
        }
    }

    /**
     * Return an array of `Datacentre` structs for country code
     * @param countryCode Unique two-character string code
     * @returns Array of Datacentres
     */
    public async getDataCentresByCountryCode(countryCode: string, status?: EnumStatus) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                if (status === undefined) {
                    response = await this.vdaWeb3Client.getDataCentresByCountryCode(countryCode);
                } else {
                    response = await this.vdaWeb3Client.getDataCentresByCountryCodeAndStatus(countryCode, status);
                }
                
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data
            } else {
                if (status === undefined) {
                    response = await this.contract!.callStatic.getDataCentresByCountryCode(countryCode);
                } else {
                    response = await this.contract!.callStatic.getDataCentresByCountryCodeAndStatus(countryCode, status);
                }

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get datacentres by country code (${message})`);
        }
    }

    /**
     * Return an array of `Datacentre` structs for region code
     * @param regionCode Unique region string code
     * @returns Array of Datacentres
     */
    public async getDataCentresByRegionCode(regionCode: string, status?: EnumStatus) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                if (status === undefined) {
                    response = await this.vdaWeb3Client.getDataCentresByRegionCode(regionCode);
                } else {
                    response = await this.vdaWeb3Client.getDataCentresByRegionCodeAndStatus(regionCode, status);
                }
                
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data
            } else {
                if (status === undefined) {
                    response = await this.contract!.callStatic.getDataCentresByRegionCode(regionCode);
                } else {
                    response = await this.contract!.callStatic.getDataCentresByRegionCodeAndStatus(regionCode, status);
                }

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get datacentres by region code (${message})`);
        }
    }

    /**
     * @param name Unique name of the storage node
     * @param endpointUri The storage node endpoint
     * @param countryCode Unique two-character string code
     * @param regionCode Unique region string code
     * @param datacentreId Unique datacentre identifier registered by contract owner
     * @param lat Latitude
     * @param long Longitude
     * @param authSignature Signature signed by a trusted signer
     */
    public async addNode(
        name: string,
        endpointUri: string,
        countryCode: string,
        regionCode: string,
        datacentreId: BigNumberish,
        latVal: number,
        longVal: number,
        slotCount: BigNumberish,
        acceptFallbackSlots: boolean,
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
            ["string", "address", "string", "uint", "int", "int", "uint", "bool", "uint"],
            [name, this.didAddress, `${endpointUri}${countryCode}${regionCode}`, datacentreId, lat, long, slotCount, acceptFallbackSlots, nonce]
        );
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray);

        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase();
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray);

        const response = await this.vdaWeb3Client!.addNode(
            {
                name,
                didAddress: this.didAddress,
                endpointUri,
                countryCode,
                regionCode,
                datacentreId,
                lat,
                long,
                slotCount,
                acceptFallbackSlots
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
    public async removeNodeStart(unregisterDateTime: BigNumberish, fallbackInfo: IFallbackNodeInfo) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const privateKeyArray = new Uint8Array(
            Buffer.from(this.config.signKey.slice(2), "hex")
        );

        // Sign the blockchain request as this DID
        const nonce = await this.nonceFN();
        const requestMsg = ethers.utils.solidityPack(
            ["address", "uint", "address", "uint", "uint", "bytes", "uint"],
            [this.didAddress, unregisterDateTime, fallbackInfo.fallbackNodeAddress, fallbackInfo.availableSlots, fallbackInfo.fallbackProofTime, fallbackInfo.availableSlotsProof, nonce]
        );
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray);

        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase();
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray);
        
        const response = await this.vdaWeb3Client!.removeNodeStart(
            this.didAddress,
            unregisterDateTime,
            fallbackInfo,
            requestSignature,
            requestProof
        );

        if (response.success !== true) {
            throw new Error(`Failed to remove node start: ${response.reason}`);
        }
    }

    /**
     * Complete storage node unregisteration
     * @param fundReleasedTo Address that receives the remaining fund 
     * @param fallbackMigrationProof A message signed by the `fallbackNode` specified in the 
     * original `removeNodeStart()` request confirming the migration of any remaining data has been completed.
     */
    public async removeNodeComplete(fundReleasedTo:string, fallbackMigrationProof: BytesLike) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const privateKeyArray = new Uint8Array(
            Buffer.from(this.config.signKey.slice(2), "hex")
        );

        // Sign the blockchain request as this DID
        const nonce = await this.nonceFN();
        const requestMsg = ethers.utils.solidityPack(
            ["address", "address", "bytes", "uint"],
            [this.didAddress, fundReleasedTo, fallbackMigrationProof, nonce]
        );
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray);

        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase();
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray);

        const response = await this.vdaWeb3Client!.removeNodeComplete(
            this.didAddress,
            fundReleasedTo,
            fallbackMigrationProof,
            requestSignature,
            requestProof
        );

        if (response.success !== true) {
            throw new Error(`Failed to remove node complete: ${response.reason}`);
        }
    }

    /**
     * Check whether node name is registered
     * @param name Node name to be checked
     * @returns `true` if registered, otherwise `false` 
     */
    public async isRegisteredNodeName(name: string) : Promise<boolean> {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.isRegisteredNodeName(name);

                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.isRegisteredNodeName(name);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to check node name (${message})`);
        }
    }

    /**
     * Check whether DID address is registered
     * @param didAddress DID address to be checked
     * @returns `true` if registered, otherwise `false` 
     */
    public async isRegisteredNodeAddress(didAddress = this.didAddress) : Promise<boolean> {
        if (this.readOnly && !didAddress) {
            throw new Error(`Need didAddress in read only mode`)
        }

        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.isRegisteredNodeAddress(didAddress);

                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.isRegisteredNodeAddress(didAddress);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to check node address (${message})`);
        }
    }

    /**
     * Check whether EndpointURI is registered
     * @param endpointUri endpoint to be checked
     * @returns `true` if registered, otherwise `false` 
     */
    public async isRegisteredNodeEndpoint(endpointUri: string) : Promise<boolean> {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.isRegisteredNodeEndpoint(endpointUri);

                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.isRegisteredNodeEndpoint(endpointUri);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to check node address (${message})`);
        }
    }

    private async standardizeNode(data: any) : Promise<IStorageNode> {
        const decimal = await this.getContractDecimal();
        const establishmentDate = new Date(data.establishmentDate.toNumber() * 1000);


        const result: IStorageNode = {
            name: data.name,
            didAddress: data.didAddress,
            endpointUri: data.endpointUri,
            countryCode: data.countryCode,
            regionCode: data.regionCode,
            datacentreId: data.datacentreId.toNumber(),
            lat: Number(ethers.utils.formatUnits(data.lat, decimal)),
            long: Number(ethers.utils.formatUnits(data.long, decimal)),
            slotCount: data.slotCount,
            establishmentDate: establishmentDate.toLocaleString(),
            acceptFallbackSlots: data.acceptFallbackSlots,
            status: data.status,
        };

        if (data.unregisterTime.toNumber() > 0) {
            result.unregisterTime = new Date(data.unregisterTime.toNumber() * 1000).toLocaleString();
            result.fallbackNodeAddress = data.fallbackNodeAddress;
        }
        
        return result;
    }

    /**
     * Returns a storage node for name
     * @param name Name of the storage node
     * @returns Storage node if exist. `undefined` if not exist
     */
    public async getNodeByName(name: string) : Promise<IStorageNode | undefined> {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getNodeByName(name);
                if (response.success !== true) {
                    if (response.errorObj?.errorName === 'InvalidName') {
                        return undefined;
                    }
                    throw new Error(response.reason);
                }

                return await this.standardizeNode(response.data)
            } else {
                response = await this.contract!.callStatic.getNodeByName(name);
                return await this.standardizeNode(response);
            }
        } catch (err:any ) {
            if (err.errorObj?.errorName === 'InvalidName' || err.errorName === 'InvalidName' ) {
                return undefined;
            }
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get node by name (${message})`);
        }
    }

    /**
     * Returns a storage node for didAddress
     * @param didAddress DID address that is associated with the storage node
     * @returns Storage node if exist. `undefined` if not exist
     */
    public async getNodeByAddress(didAddress = this.didAddress) : Promise<IStorageNode | undefined> {
        if (this.readOnly && !didAddress) {
            throw new Error(`Need didAddress in read only mode`)
        }

        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getNodeByAddress(didAddress);
                if (response.success !== true) {
                    if (response.errorObj?.errorName === 'InvalidDIDAddress') {
                        return undefined;
                    }
                    throw new Error(response.reason);
                }

                return await this.standardizeNode(response.data)
            } else {
                response = await this.contract!.callStatic.getNodeByAddress(didAddress);
                return await this.standardizeNode(response);
            }
        } catch (err:any ) {
            if (err.errorObj?.errorName === 'InvalidDIDAddress' || err.errorName === 'InvalidDIDAddress' ) {
                return undefined;
            }
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get node by address (${message})`);
        }
    }

    /**
     * Returns a storage node for didAddress
     * @param endpointUri The storage node endpoint
     * @returns Storage node if exist. `undefined` if not exist
     */
    public async getNodeByEndpoint(endpointUri: string) : Promise<IStorageNode | undefined> {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getNodeByEndpoint(endpointUri);

                if (response.success !== true) {
                    if (response.errorObj?.errorName === 'InvalidEndpointUri') {
                        return undefined;
                    }
                    throw new Error(response.reason);
                }

                return await this.standardizeNode(response.data)
            } else {
                response = await this.contract!.callStatic.getNodeByEndpoint(endpointUri);

                return await this.standardizeNode(response);
            }
        } catch (err:any ) {
            if (err.errorObj?.errorName === 'InvalidEndpointUri' || err.errorName === 'InvalidEndpointUri' ) {
                return undefined;
            }
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get node by endpoint (${message})`);
        }
    }

    /**
     * Return an array of `Storagenode` structs for country code
     * @param countryCode Unique two-character string code
     * @param pageSize Number of maximum elements of returned
     * @param pageNumber Page index. Index starts from 1
     * @param status Status of nodes to be returned
     * @returns An array of `Storagenode` structs
     */
    public async getNodesByCountryCode(countryCode: string, pageSize: BigNumberish, pageNumber: BigNumberish, status?: EnumStatus) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                if (status === undefined) {
                    response = await this.vdaWeb3Client.getNodesByCountryCode(countryCode, pageSize, pageNumber);
                } else {
                    response = await this.vdaWeb3Client.getNodesByCountryCodeAndStatus(countryCode, status, pageSize, pageNumber);
                }
                
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return await Promise.all(
                    response.data.map(async (item: any) => await this.standardizeNode(item))
                );
            } else {
                if (status === undefined) {
                    response = await this.contract!.callStatic.getNodesByCountryCode(countryCode, pageSize, pageNumber);
                } else {
                    response = await this.contract!.callStatic.getNodesByCountryCodeAndStatus(countryCode, status, pageSize, pageNumber);
                }
                
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
     * @param pageSize Number of maximum elements of returned
     * @param pageNumber Page index. Index starts from 1
     * @param status Status of nodes to be returned
     * @returns An array of `Storagenode` structs
     */
    public async getNodesByRegionCode(regionCode: string, pageSize: BigNumberish, pageNumber: BigNumberish, status?: EnumStatus) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                if (status === undefined) {
                    response = await this.vdaWeb3Client.getNodesByRegionCode(regionCode, pageSize, pageNumber);
                } else {
                    response = await this.vdaWeb3Client.getNodesByRegionCodeAndStatus(regionCode, status, pageSize, pageNumber);
                }
                
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return await Promise.all(
                    response.data.map(async (item: any) => await this.standardizeNode(item))
                );
            } else {
                if (status === undefined) {
                    response = await this.contract!.callStatic.getNodesByRegionCode(regionCode, pageSize, pageNumber);
                } else {
                    response = await this.contract!.callStatic.getNodesByRegionCodeAndStatus(regionCode, status, pageSize, pageNumber);
                }

                return await Promise.all(
                    response.map(async (item: any) => await this.standardizeNode(item))
                );
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get nodes by region (${message})`);
        }
    }

    /**
     * Return an array of `Storagenode` structs for specified status
     * @param status Status of targeting storage nodes
     * @param pageSize Number of maximum elements of returned
     * @param pageNumber Page index. Index starts from 1
     * @returns An array of `Storagenode` structs
     */
    public async getNodesByStatus(status: EnumStatus, pageSize: BigNumberish, pageNumber: BigNumberish) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getNodesByStatus(status, pageSize, pageNumber);
                
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return await Promise.all(
                    response.data.map(async (item: any) => await this.standardizeNode(item))
                );
            } else {
                response = await this.contract!.callStatic.getNodesByStatus(status, pageSize, pageNumber);

                return await Promise.all(
                    response.map(async (item: any) => await this.standardizeNode(item))
                );
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get nodes by status (${message})`);
        }
    }

    /**
     * Returns whether staking is required to call `addNode()` function
     * @returns The value of required status
     */
    public async isStakingRequired() {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.isStakingRequired();
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.isStakingRequired();
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to check staking required (${message})`);
        }
    }

    /**
     * Returns the `STAKE_PER_SLOT` value of contract
     * @returns Required token amount for one slot
     */
    public async getStakePerSlot() {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getStakePerSlot();
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.getStakePerSlot();
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get StakePerSlot (${message})`);
        }
    }

    /**
     * Return the range of `slotCount` value by pair of minimum and maximum value
     * @returns Array of min and max value
     */
    public async getSlotCountRange() {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getSlotCountRange();
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.getSlotCountRange();
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get StakePerSlot (${message})`);
        }
    }

    /**
     * Returns the amount of staked token for inputed DID address.
     * @param didAddress DID address that added a storage node
     * @returns Amount of staked token
     */
    public async getBalance(didAddress = this.didAddress) {
        let response;
        if (this.readOnly && !didAddress) {
            throw new Error(`Need didAddress in read only mode`)
        }

        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getBalance(didAddress);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.getBalance(didAddress);
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get Balance (${message})`);
        }
    }

    /**
     * Returns the amount of excess tokens
     * @param didAddress DID address
     * @returns 
     */
    public async excessTokenAmount(didAddress = this.didAddress) {
        let response;
        if (this.readOnly && !didAddress) {
            throw new Error(`Need didAddress in read only mode`)
        }

        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.excessTokenAmount(didAddress);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.excessTokenAmount(didAddress);
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get excess token amount (${message})`);
        }
    }

    /**
     * Withdraw `amount` of tokens to the `to` address
     * @param to Recipient address
     * @param amount Token amount to be withdrawn
     */
    public async withdraw(to:string, amount: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const privateKeyArray = new Uint8Array(
            Buffer.from(this.config.signKey.slice(2), "hex")
        );

        // Sign the blockchain request as this DID
        const nonce = await this.nonceFN();
        const requestMsg = ethers.utils.solidityPack(
            ["address", "address", "uint", "uint"],
            [this.didAddress, to, amount, nonce]
        );
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray);

        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase();
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray);

        const response = await this.vdaWeb3Client!.withdraw(
            this.didAddress,
            to,
            amount,
            requestSignature,
            requestProof
        );

        if (response.success !== true) {
            throw new Error(`Failed to withdraw: ${response.reason}`);
        }
    }

    /**
     * Deposit verida tokens from self
     * @param amount Depositing amount of Verida token
     */
    public async depositToken(amount: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }
        
        const response = await this.vdaWeb3Client!.depositToken(
            this.didAddress,
            amount
        );

        if (response.success !== true) {
            throw new Error(`Failed to deposit token: ${response.reason}`);
        }
    }

    /**
     * Deposit verida tokens from external provider
     * @param from Wallet or smart contract address that provides tokens
     * @param amount Depositing amount of Verida token
     */
    public async depositTokenFromProvider(from: string, amount: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }
        
        const response = await this.vdaWeb3Client!.depositTokenFromProvider(
            this.didAddress,
            from,
            amount
        );

        if (response.success !== true) {
            throw new Error(`Failed to deposit token from provider: ${response.reason}`);
        }
    }

    /**
     * Get the fee for logging a node issue
     * @returns Amount of Verida token for fee
     */
    public async getNodeIssueFee() {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getNodeIssueFee();
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.getNodeIssueFee();
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get node issue fee (${message})`);
        }
    }

    /**
     * Return the current token amount staked by logging issues
     * @returns Amount of VDA tokens
     */
    public async getTotalIssueFee() {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getTotalIssueFee();
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.getTotalIssueFee();
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get total staked issue fee (${message})`);
        }
    }

    /**
     * Return the current same node log duration
     * @returns Same node log duration in seconds
     */
    public async getSameNodeLogDuration() {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getSameNodeLogDuration();
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.getSameNodeLogDuration();
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get log duration per same node (${message})`);
        }
    }

    /**
     * Return the current log limit per day
     * @returns Log limit count per day
     */
    public async getLogLimitPerDay() {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getLogLimitPerDay();
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.getLogLimitPerDay();
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get log limit per day (${message})`);
        }
    }

    /**
     * Log a node issue
     * @param nodeAddress DID address of the node
     * @param reasonCode reason code of the issue
     */
    public async logNodeIssue(nodeAddress: string, reasonCode: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const privateKeyArray = new Uint8Array(
            Buffer.from(this.config.signKey.slice(2), "hex")
        );

        // Sign the blockchain request as this DID
        const nonce = await this.nonceFN();
        const requestMsg = ethers.utils.solidityPack(
            ["address", "address", "uint", "uint"],
            [this.didAddress, nodeAddress, reasonCode, nonce]
        );
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray);

        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase();
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray);

        const response = await this.vdaWeb3Client!.logNodeIssue(
            this.didAddress,
            nodeAddress,
            reasonCode,
            requestSignature,
            requestProof
        );

        if (response.success !== true) {
            throw new Error(`Failed to log node issue: ${response.reason}`);
        }
    }

    /**
     * Return the description of the reason code
     * @param code Reason code registered in the contract
     * @returns Log limit count per day
     */
    public async getReasonCodeDescription(code: BigNumberish) {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getReasonCodeDescription(code);
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.getReasonCodeDescription(code);
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get description of reason code (${message})`);
        }
    }

    /**
     * Return the list of registered reason codes
     * @returns Array of reason code list
     */
    public async getReasonCodeList() {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getReasonCodeList();
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.getReasonCodeList();
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get description of reason code (${message})`);
        }
    }

    /**
     * Returns whether withdrawal enabled
     * @returns Status of withdrawal enabled
     */
    public async isWithdrawalEnabled() {
        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.isWithdrawalEnabled();
                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.isWithdrawalEnabled();
                return response;
            }
            
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to check withdrawal enabled (${message})`);
        }
    }

    /**
     * Accept 2-step ownership transfer
     */
    public async acceptOwnership() {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const response = await this.vdaWeb3Client!.acceptOwnership();

        if (response.success !== true) {
            throw new Error(`Failed to accept the ownership: ${response.reason}`);
        }
    }

    /**
     * Lock the tokens for a purpose
     * @param purpose Purpose of locking
     * @param amount Token amount to be locked
     * @param withDeposit If true, tokens will be deposited from transaction sender(=config.signKey)
     */
    public async lock(
        purpose: string,
        amount: BigNumberish,
        withDeposit = false
    ) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const privateKeyArray = new Uint8Array(
            Buffer.from(this.config.signKey.slice(2), "hex")
        );

        // Sign the blockchain request as this DID
        const nonce = await this.nonceFN();
        const requestMsg = ethers.utils.solidityPack(
            ["address", "string", "uint", "bool", "uint"],
            [this.didAddress, purpose, amount, withDeposit, nonce]
        );
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray);

        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase();
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray);

        const response = await this.vdaWeb3Client!.lock(
            this.didAddress,
            purpose,
            amount,
            withDeposit,
            requestSignature,
            requestProof
        );

        if (response.success !== true) {
            throw new Error(`Failed to lock: ${response.reason}`);
        }
    }


    /**
     * Return the locked amount for the given purpose
     * @param purpose Purpose of locking
     * @param didAddress DID address
     */
    public async locked(purpose: string, didAddress = this.didAddress) {
        if (this.readOnly && !didAddress) {
            throw new Error(`Need didAddress in read only mode`)
        }

        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.locked(didAddress, purpose);

                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.locked(didAddress, purpose);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get locked amount (${message})`);
        }
    }

    /**
     * 
     * @param pageSize Number of maximum elements of returned
     * @param pageNumber Page index. Starts from 1
     * @param didAddress DIDAddress
     */
    public async getLocks(
        pageSize: BigNumberish,
        pageNumber: BigNumberish,
        didAddress = this.didAddress
    ) {
        if (this.readOnly && !didAddress) {
            throw new Error(`Need didAddress in read only mode`)
        }

        let response;
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getLocks(didAddress, pageSize, pageNumber);

                if (response.success !== true) {
                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.getLocks(didAddress, pageSize, pageNumber);

                return response;
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`Failed to get locked information list (${message})`);
        }
    }

    /**
     * Unlock the token for specified purpose. 
     * @param purpose Purpose of locked
     * @param withdrawWallet Withdraw wallet address. If not set, token will be deposited as credit
     */
    public async unlock(
        purpose: string,
        withdrawWallet?: string
    ) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const privateKeyArray = new Uint8Array(
            Buffer.from(this.config.signKey.slice(2), "hex")
        );

        // Sign the blockchain request as this DID
        const nonce = await this.nonceFN();
        let requestMsg: string;
        if (!withdrawWallet) {
            requestMsg = ethers.utils.solidityPack(
                ["address", "string", "uint"],
                [this.didAddress, purpose, nonce]
            );
        } else {
            requestMsg = ethers.utils.solidityPack(
                ["address", "string", "address", "uint"],
                [this.didAddress, purpose, withdrawWallet!, nonce]
            );
        }
        
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray);

        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase();
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray);

        let response;
        if (!withdrawWallet) {
            response = await this.vdaWeb3Client!.unlock(
                this.didAddress,
                purpose,
                requestSignature,
                requestProof
            );
        } else {
            response = await this.vdaWeb3Client!.unlockAndWithdraw(
                this.didAddress,
                purpose,
                withdrawWallet,
                requestSignature,
                requestProof
            );
        }
        
        if (response.success !== true) {
            throw new Error(`Failed to unlock: ${response.reason}`);
        }
    }
}