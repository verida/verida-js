import { Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI as abiList, RPC_URLS } from "@verida/vda-common";
import { JsonRpcProvider } from "@ethersproject/providers";
import { BigNumberish } from "ethers";
import { EnumStatus } from "@verida/types";

export class VeridaNodeClient {
    private contract: Contract;

    /**
     * Constructor
     * @param network Network name to test. Should be one of the Verida supported network names
     * @param RPC_URL Optional parameter. RPC_URL to be used
     */
    public constructor(network:string, RPC_URL?: string) {
        const rpcUrl = RPC_URL?? RPC_URLS[network];
        if (!rpcUrl) {
            throw new Error(`Unable to locate RPC_URL for network: ${network}`)
        }

        const contractABI = abiList["StorageNodeRegistry"];
        const provider = new JsonRpcProvider(rpcUrl);
        const address = CONTRACT_ADDRESS["StorageNodeRegistry"][network];

        if (!address) {
            throw new Error(`Empty contract address for network-${network}`)
        }

        this.contract = new Contract(address, contractABI.abi, provider);
    }

    /**
     * Execute view function 
     * @param functionName Function name to be called
     * @param errMsg Error message to be returned when error occured
     * @param params Parameters of the function
     * @returns Value of function
     */
    private async executeFunction(functionName:string, errMsg: string, ...params: any[]) {
        let data;
        try {
            data = (await this.contract.callStatic[functionName](...params));
        } catch (err: any) {
            const message = err.reason ? err.reason : err.message;
            throw new Error(`${errMsg} (${message})`);
        }
        
        return data;
    }

    /**
     * Call DECIMAL() function of `StorageNodeRegistry` contract
     */
    public async getContractDecimal(): Promise<number> {
        return await this.executeFunction(
            'DECIMAL',
            'Failed to get DECIMAL'
        );
    }

    /**
     * Call getBalance() function of `StorageNodeRegistry` contract
     * @param didAddress DID address 
     * @returns Amount of staked token
     */
    public async getBalance(didAddress: string) {
        return await this.executeFunction('getBalance', 'Failed to get balance', didAddress);
    }

    /**
     * Call excessTokenAmount() function of `StorageNodeRegistry` contract
     * @param didAddress DID address
     * @return Excess token amount
     */
    public async excessTokenAmount(didAddress: string) {
        return await this.executeFunction('excessTokenAmount', 'Failed to get excess token amount', didAddress);
    }
    
    /**
     * Call getDataCentres() function of `StorageNodeRegistry` contract
     * @param ids Array of datacentreIds
     */
    public async isRegisteredDataCentreName(name: string) {
        return await this.executeFunction(
            'isRegisteredDataCentreName',
            'Failed to check datacentre name',
            name
        );
    }
    
    /**
     * Call getDataCentres() function of `StorageNodeRegistry` contract
     * @param ids Array of datacentreIds
     */
    public async getDataCentresById(ids: BigNumberish[]) {
        return await this.executeFunction(
            'getDataCentresById',
            'Failed to get datacentres by id',
            ids
        );
    }

    /**
     * Call getDataCentresByName() function of `StorageNodeRegistry` contract
     * @param names Array of name
     */
    public async getDataCentresByName(names: string[]) {
        return await this.executeFunction(
            'getDataCentresByName',
            'Failed to get datacentres by name',
            names
        );
    }

    /**
     * Call getDataCentresByCountry() function of `StorageNodeRegistry` contract
     * @param countryCode Country code of data centres
     * @param status Status of data centres
     */
    public async getDataCentresByCountryCode(countryCode: string, status?: EnumStatus) {
        if (status === undefined) {
            return await this.executeFunction(
                'getDataCentresByCountryCode',
                'Failed to get datacentres by country',
                countryCode
            );
        } else {
            return await this.executeFunction(
                'getDataCentresByCountryCodeAndStatus',
                'Failed to get datacentres by country and status',
                countryCode,
                status
            );
        }
    }

    /**
     * Call getDataCentresByRegion() function of `StorageNodeRegistry` contract
     * @param regionCode Region code of data centres
     * @param status Status of data centres
     */
    public async getDataCentresByRegionCode(regionCode: string, status?: EnumStatus) {
        if (status === undefined) {
            return await this.executeFunction(
                'getDataCentresByRegionCode',
                'Failed to get datacentres by region',
                regionCode
            );
        } else {
            return await this.executeFunction(
                'getDataCentresByRegionCodeAndStatus',
                'Failed to get datacentres by region and status',
                regionCode,
                status
            );
        }
    }

    /**
     * Call getNodeIssueFee() function of `StorageNodeRegistry` contract
     * @returns Amount of Verida token for fee
     */
    public async getNodeIssueFee() {
        return await this.executeFunction(
            'getNodeIssueFee',
            'Failed to get node issue fee'
        );
    }

    /**
     * Call getSameNodeLogDuration() function of `StorageNodeRegistry` contract
     * @returns Same node log duration in seconds
     */
    public async getSameNodeLogDuration() {
        return await this.executeFunction(
            'getSameNodeLogDuration',
            'Failed to get log duration for same node'
        );
    }

    /**
     * Call getLogLimitPerDay() function of `StorageNodeRegistry` contract
     * @returns Same node log duration in seconds
     */
    public async getLogLimitPerDay() {
        return await this.executeFunction(
            'getLogLimitPerDay',
            'Failed to get log limit per day'
        );
    }

    /**
     * Call getReasonCodeList() function of `StorageNodeRegistry` contract
     * @returns List of reason codes
     */
    public async getReasonCodeList() {
        return await this.executeFunction(
            'getReasonCodeList',
            'Failed to get reason code list'
        );
    }

    /**
     * Call getReasonCodeDescription() function of `StorageNodeRegistry` contract
     * @returns List of reason codes
     */
    public async getReasonCodeDescription(reasonCode: BigNumberish) {
        return await this.executeFunction(
            'getReasonCodeDescription',
            'Failed to get reason code description',
            reasonCode
        );
    }

    /**
     * Check `name` is registered as node name
     * @param name Name to be checked
     * @returns true if registered, otherwise false
     */
    public async isRegisteredNodeName(name: string) {
        return await this.executeFunction(
            'isRegisteredNodeName',
            'Failed to check node name',
            name
        );
    }

    /**
     * Check `didAddress` is registered as node address
     * @param didAddress DID address to be checked
     * @returns true if registered, otherwise false
     */
    public async isRegisteredNodeAddress(didAddress: string) {
        return await this.executeFunction(
            'isRegisteredNodeAddress',
            'Failed to check node address',
            didAddress
        );
    }

    /**
     * Check `endpointUri` is registered as node endpoint
     * @param endpointUri EndpointUri to be checked
     * @returns true if registered, otherwise false
     */
    public async isRegisteredNodeEndpoint(endpointUri: string) {
        return await this.executeFunction(
            'isRegisteredNodeEndpoint',
            'Failed to check node endpoint',
            endpointUri
        );
    }

    /**
     * Get a node by name
     * @param name Node name
     * @returns A storage node if name is registered. Otherwise rejected
     */
    public async getNodeByName(name: string) {
        return await this.executeFunction(
            'getNodeByName',
            'Failed to get node by name',
            name
        );
    }

    /**
     * Get a node by DID address
     * @param didAddress Node address
     * @returns A storage node if address is registered. Otherwise rejected
     */
    public async getNodeByAddress(didAddress: string) {
        return await this.executeFunction(
            'getNodeByAddress',
            'Failed to get node by address',
            didAddress
        );
    }

    /**
     * Get a node by endpointUri
     * @param endpointUri EndpointUri of a storage node
     * @returns A storage node if endpointUri is registered. Otherwise rejected
     */
    public async getNodeByEndpoint(endpointUri: string) {
        return await this.executeFunction(
            'getNodeByEndpoint',
            'Failed to get node by endpoint',
            endpointUri
        );
    }

    /**
     * Get nodes by country and status
     * @param countryCode Country code of nodes
     * @param status Status of nodes
     */
    public async getNodesByCountryCode(
        countryCode: string, 
        status?: EnumStatus) {
        if (status === undefined) {
            return await this.executeFunction(
                'getNodesByCountryCode',
                'Failed to get nodes by country',
                countryCode
            );
        } else {
            return await this.executeFunction(
                'getNodesByCountryCodeAndStatus',
                'Failed to get nodes by country and status',
                countryCode,
                status
            );
        }
    }

    /**
     * Get nodes by region and status
     * @param regionCode Region code of nodes
     * @param status Status of nodes
     */
    public async getNodesByRegionCode(
        regionCode: string, 
        status?: EnumStatus) {
        if (status === undefined) {
            return await this.executeFunction(
                'getNodesByRegionCode',
                'Failed to get nodes by region',
                regionCode
            );
        } else {
            return await this.executeFunction(
                'getNodesByRegionCodeAndStatus',
                'Failed to get nodes by region and status',
                regionCode,
                status
            );
        }
    }

    /**
     * Get nodes by status
     * @param status Status of nodes
     */
    public async getNodesByStatus(
        status: EnumStatus) {
        return await this.executeFunction(
            'getNodesByStatus',
            'Failed to get nodes by status',
            status
        );
    }

    /**
     * Call isStakingRequired() function of `StorageNodeRegistry` contract
     * @returns The value of required status
     */
    public async isStakingRequired() {
        return await this.executeFunction(
            'isStakingRequired',
            'Failed to check staking required'
        );
    }

    /**
     * Call getStakePerSlot() function of `StorageNodeRegistry` contract
     * @returns Required token amount for one slot
     */
    public async getStakePerSlot() {
        return await this.executeFunction(
            'getStakePerSlot',
            'Failed to get stake per slot'
        );
    }

    /**
     * Call getSlotCountRange() function of `StorageNodeRegistry` contract
     * @returns Array of min and max value
     */
    public async getSlotCountRange() {
        return await this.executeFunction(
            'getSlotCountRange',
            'Failed to get slot count range'
        );
    }

    /**
     * Call isWithdrawalEnabled() function of `StorageNodeRegistry` contract
     * @returns The status of withdrawal enabled
     */
    public async isWithdrawalEnabled() {
        return await this.executeFunction(
            'isWithdrawalEnabled',
            'Failed to check withdrawal enabled'
        );
    }

    /**
     * Call DECIMAL() function of `StorageNodeRegistry` contract
     */
    public async getVDATokenAddress(): Promise<string> {
        return await this.executeFunction(
            'getVDATokenAddress',
            'Failed to get Verida Token Address'
        );
    }

}