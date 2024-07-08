import { BlockchainAnchor, Web3SelfTransactionConfig } from '@verida/types'
import { BigNumber, Contract, ethers, Wallet } from "ethers";
import { getContractInfoForBlockchainAnchor, getDefaultRpcUrl } from "@verida/vda-common";
import { getVeridaContract, VeridaContract } from '@verida/web3';
import { JsonRpcProvider } from '@ethersproject/providers';

export class VeridaTokenClient {

    protected config: Web3SelfTransactionConfig;
    protected blockchainAnchor: BlockchainAnchor;
    protected readOnly: boolean;
    protected address: String|undefined;
    protected vdaWeb3Client? : VeridaContract
    protected contract?: Contract;

    protected decimalCache: number|undefined;
    protected nameCache: string|undefined;
    protected symbolCache: string|undefined;
    protected totalSupplyCache: BigNumber|undefined;
    protected rateDenominatorCache: number|undefined;

    protected constructor(config: Web3SelfTransactionConfig, addr?: string) {
        this.config = config;
        if (!config.blockchainAnchor) {
            throw new Error('Should provid "blockchainAnchor" in the configuration');
        }
        this.blockchainAnchor = config.blockchainAnchor;

        if (!config.rpcUrl) {
            this.config.rpcUrl = getDefaultRpcUrl(this.blockchainAnchor)!
        }

        this.readOnly = true;
        this.address = addr;
        if (this.address !== undefined) {
            this.readOnly = false;
        }

        const contractInfo = getContractInfoForBlockchainAnchor(this.blockchainAnchor, "token");
        if (!this.readOnly) {
            this.vdaWeb3Client = getVeridaContract(
                "web3",
                {
                    ...contractInfo,
                    ...config,
                    blockchainAnchor: this.blockchainAnchor
                }
            );
        } else {
            const rpcUrl = config.rpcUrl ?? getDefaultRpcUrl(this.blockchainAnchor)!;
            const provider = new JsonRpcProvider(rpcUrl);
            this.contract = new Contract(contractInfo.address, contractInfo.abi.abi, provider);
        }
    }

    public static CreateAsync = async (config: Web3SelfTransactionConfig) => {
        let addr: string | undefined;
        if (config.privateKey) {
            addr = new Wallet(config.privateKey!).address;
        } else if (config.signer) {
            addr = await config.signer.getAddress();
        }
        return new VeridaTokenClient(config, addr);
    }

    /**
     * Get the token name
     * @returns Token name
     */
    public async name() {
        if (this.nameCache) {
            return this.nameCache;
        }

        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.name();

                if (response.success !== true) {
                    throw new Error(`Failed to read name`);
                }

                response = response.data
            } else {
                response = await this.contract!.callStatic.name();

                if (!response) {
                    throw new Error(`Failed to read name`);
                }
            }

            this.nameCache = response;
            return this.nameCache;
        } catch (err:any ) {
            throw new Error(`Failed to read name: (${err.message})`);
        }
    }

    /**
     * Get the token symbol
     * @returns Token symbol
     */
    public async symbol() {
        if (this.symbolCache) {
            return this.symbolCache;
        }

        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.symbol();

                if (response.success !== true) {
                    throw new Error(`Failed to read symbol`);
                }

                response = response.data
            } else {
                response = await this.contract!.callStatic.symbol();

                if (!response) {
                    throw new Error(`Failed to read symbol`);
                }
            }

            this.symbolCache = response;
            return this.symbolCache;
        } catch (err:any ) {
            throw new Error(`Failed to read symbol: (${err.message})`);
        }
    }

    /**
     * Get teh decimal of the Token
     * @returns Decimal in Number type
     */
    public async decimals() {
        if (this.decimalCache) {
            return this.decimalCache;
        }

        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.decimals();

                if (response.success !== true) {
                    throw new Error(`Failed to read deciaml`);
                }

                response = response.data
            } else {
                response = await this.contract!.callStatic.decimals();

                if (!response) {
                    throw new Error(`Failed to read decimal`);
                }
            }

            this.decimalCache = Number(response);
            return this.decimalCache;
        } catch (err:any ) {
            throw new Error(`Failed to read decimal: (${err.message})`);
        }
    }

    /**
     * Get the total supply
     * @returns Total supply in big number format
     */
    public async totalSupply() {
        if (this.totalSupplyCache) {
            return this.totalSupplyCache;
        }

        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.totalSupply();

                if (response.success !== true) {
                    throw new Error(`Failed to read totalSupply`);
                }

                response = response.data
            } else {
                response = await this.contract!.callStatic.totalSupply();

                if (!response) {
                    throw new Error(`Failed to read totalSupply`);
                }
            }

            this.totalSupplyCache = response;
            return this.totalSupplyCache;
        } catch (err:any ) {
            throw new Error(`Failed to read totalSupply: (${err.message})`);
        }
    }

    /**
     * Get the total supply
     * @returns Total supply in big number format
     */
    public async balanceOf(addr = this.address) {
        if (!addr) {
            throw new Error(`Provide address to get the balance`);
        }

        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.balanceOf(addr);

                if (response.success !== true) {
                    throw new Error(`Failed to get the balance`);
                }

                response = response.data
            } else {
                response = await this.contract!.callStatic.balanceOf(addr);

                if (!response) {
                    throw new Error(`Failed to get the balance`);
                }
            }

            return response;
        } catch (err:any ) {
            throw new Error(`Failed to get the balance of ${addr}: (${err.message})`);
        }
    }

    /**
     * @notice Transfer token to spcified address
     * @param to Receiver
     * @param value Amount to be transferred
     */
    public async transfer(to: string, value: BigNumber) {
        if (this.readOnly) {
            throw new Error(`Unable to submit to blockchain. No 'signer' provided in config.`)
        }

        const response = await this.vdaWeb3Client!.transfer(to, value);
        if (!response.success !== true) {
            throw new Error(`Failed to transfer: ${response.reason}`);
        }
    }

    /**
     * Get the allowance
     * @param owner Address
     * @param spender Address
     * @returns Amount of allowed token
     */
    public async allowance(owner: string, spender: string) {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.allowance(owner, spender);

                if (response.success !== true) {
                    throw new Error(`Failed to get the allowance`);
                }

                response = response.data
            } else {
                response = await this.contract!.callStatic.allowance(owner, spender);

                if (!response) {
                    throw new Error(`Failed to get the allowance`);
                }
            }

            return response;
        } catch (err:any ) {
            throw new Error(`Failed to get the allowance of ${owner} to ${spender}: (${err.message})`);
        }
    }

    /**
     * Approve token
     * @param spender Address
     * @param value Amount of token to be approved
     */
    public async approve(spender: string, value: BigNumber) {
        if (this.readOnly) {
            throw new Error(`Unable to submit to blockchain. No 'signer' provided in config.`)
        }

        const response = await this.vdaWeb3Client!.approve(spender, value);
        if (!response.success !== true) {
            throw new Error(`Failed to approve: ${response.reason}`);
        }
    }

    /**
     * Transfer token from `from` to `to`
     * @param from Address
     * @param to Address
     * @param value Amount
     */
    public async transferFrom(from: string, to: string, value: BigNumber) {
        if (this.readOnly) {
            throw new Error(`Unable to submit to blockchain. No 'signer' provided in config.`)
        }

        const response = await this.vdaWeb3Client!.transferFrom(from, to, value);
        if (!response.success !== true) {
            throw new Error(`Failed to transfer from ${from} to ${to}: ${response.reason}`);
        }
    }

    /**
     * Get teh `RATE_DENOMINATOR` of the contract for rate specified values
     * @returns Rate denominator
     */
    public async rateDenominator() {
        if (this.rateDenominatorCache) {
            return this.rateDenominatorCache;
        }

        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.RATE_DENOMINATOR();

                if (response.success !== true) {
                    throw new Error(`Failed to read rate denominator`);
                }

                response = response.data
            } else {
                response = await this.contract!.callStatic.RATE_DENOMINATOR();

                if (!response) {
                    throw new Error(`Failed to read rate denominator`);
                }
            }

            this.rateDenominatorCache = Number(response);
            return this.rateDenominatorCache;
        } catch (err:any ) {
            throw new Error(`Failed to read rate denominator: (${err.message})`);
        }
    }

    /**
     * Get number of minters
     * @returns Number
     */
    public async getMinterCount() {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getMinterCount();

                if (response.success !== true) {
                    throw new Error(`Failed to get number of minters`);
                }

                response = response.data
            } else {
                response = await this.contract!.callStatic.getMinterCount();

                if (!response) {
                    throw new Error(`Failed to get number of minters`);
                }
            }

            return Number(response);
        } catch (err:any ) {
            throw new Error(`Failed to get number of minters: (${err.message})`);
        }
    }

    /**
     * Get the list of minter addresses
     * @returns Array of addresses
     */
    public async getMinterList() {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getMinterList();

                if (response.success !== true) {
                    throw new Error(`Failed to get minter list`);
                }

                response = response.data
            } else {
                response = await this.contract!.callStatic.getMinterList();

                if (!response) {
                    throw new Error(`Failed to get minter list`);
                }
            }

            return Number(response);
        } catch (err:any ) {
            throw new Error(`Failed to get minter list: (${err.message})`);
        }
    }

    /**
     * Get the version of the Token contract
     * @returns Version in string format
     */
    public async getVersion() {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getVersion();

                if (response.success !== true) {
                    throw new Error(`Failed to get version`);
                }

                response = response.data
            } else {
                response = await this.contract!.callStatic.getVersion();

                if (!response) {
                    throw new Error(`Failed to get version`);
                }
            }

            return Number(response);
        } catch (err:any ) {
            throw new Error(`Failed to get version: (${err.message})`);
        }
    }
}