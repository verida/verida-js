import { Web3SelfTransactionConfig } from '@verida/types';
import { VeridaTokenClient } from './VeridaTokenClient';
import { BigNumber, Wallet } from 'ethers';

export class VeridaTokenOwner extends VeridaTokenClient {
    
    protected constructor(config: Web3SelfTransactionConfig, addr?: string) {
        super(config, addr);
    }

    public static CreateAsync = async (config: Web3SelfTransactionConfig) => {
        let addr: string | undefined;
        if (config.privateKey) {
            addr = new Wallet(config.privateKey!).address;
        } else if (config.signer) {
            addr = await config.signer.getAddress();
        } else {
            // VeridaTokenOwner can't be created in read-only mode
            throw new Error(`No 'privateKey' or 'signer' in the configuration`);
        }

        return new VeridaTokenOwner(config, addr);
    }

    /**
     * Mint token 
     * @param to Address
     * @param amount 
     */
    public async mint(to: string, amount: BigNumber) {
        const response = await this.vdaWeb3Client!.mint(to, amount);
        if (response.success !== true) {
            throw new Error(`Failed to mint ${amount} tokens to ${to}: ${response.reason}`);
        }
    }

    /**
     * Add a minter
     * @param minter Address
     */
    public async addMinter(minter: string) {
        const response = await this.vdaWeb3Client!.addMinter(minter);
        if (response.success !== true) {
            throw new Error(`Failed to add a minter(${minter}): ${response.reason}`);
        }
    }

    /**
     * Revoke a minter
     * @param minter Address
     */
    public async revokeMinter(minter: string) {
        const response = await this.vdaWeb3Client!.revokeMinter(minter);
        if (response.success !== true) {
            throw new Error(`Failed to revoke a minter(${minter}): ${response.reason}`);
        }
    }

    /**
     * Enable/disable AMM pair
     * @param pair Address of AMM
     * @param enabled true/false
     */
    public async setAutomatedMarketMakerPair(pair: string, enabled = true) {
        const response = await this.vdaWeb3Client!.setAutomatedMarketMakerPair(pair, enabled);
        if (response.success !== true) {
            throw new Error(`Failed to update the status of AMM pair(${pair}): ${response.reason}`);
        }
    }

    /**
     * Update token limit in percent per wallet
     * @param rate Rate value in decimal. Ex: 0.1 means 0.1%
     */
    public async updateMaxAmountPerWalletRate(rate: number) {
        const denominator = await this.rateDenominator();
        const rateValue = BigNumber.from(denominator * rate);

        const response = await this.vdaWeb3Client!.updateMaxAmountPerWalletRate(rateValue);
        if (response.success !== true) {
            throw new Error(`Failed to update the max amount rate per wallet: ${response.reason}`);
        }
    }

    /**
     * Update token limit in percent per sell operation
     * @param rate Rate value in decimal. Ex: 0.1 means 0.1%
     */
    public async updateMaxAmountPerSellRate(rate: number) {
        const denominator = await this.rateDenominator();
        const rateValue = BigNumber.from(denominator * rate);

        const response = await this.vdaWeb3Client!.updateMaxAmountPerSellRate(rateValue);
        if (response.success !== true) {
            throw new Error(`Failed to update the max amount rate per sell: ${response.reason}`);
        }
    }

    /**
     * Exclude/include an address from sell amount limit
     * @param address Address
     * @param isExcluded true if exclude
     */
    public async excludeFromSellAmountLimit(address: string, isExcluded: boolean) {
        const response = await this.vdaWeb3Client!.excludeFromSellAmountLimit(address, isExcluded);
        if (response.success !== true) {
            throw new Error(`Failed to exclude from sell amount limit(${address}): ${response.reason}`);
        }
    }

    /**
     * Exclude/include an address from wallet amount limit
     * @param address Address
     * @param isExcluded true if exclude
     */
    public async excludeFromWalletAmountLimit(address: string, isExcluded: boolean) {
        const response = await this.vdaWeb3Client!.excludeFromWalletAmountLimit(address, isExcluded);
        if (response.success !== true) {
            throw new Error(`Failed to exclude from wallet amount limit(${address}): ${response.reason}`);
        }
    }

    /**
     * Enable/disable the selling amount limit
     * @param isEnabled boolean
     */
    public async enableMaxAmountPerSell(isEnabled: boolean) {
        const response = await this.vdaWeb3Client!.enableMaxAmountPerSell(isEnabled);
        if (response.success !== true) {
            throw new Error(`Failed to enable amount limit per sell(${isEnabled}): ${response.reason}`);
        }
    }

    /**
     * Enable/disable the wallet amount limit
     * @param isEnabled boolean
     */
    public async enableMaxAmountPerWallet(isEnabled: boolean) {
        const response = await this.vdaWeb3Client!.enableMaxAmountPerWallet(isEnabled);
        if (response.success !== true) {
            throw new Error(`Failed to enable amount limit per wallet(${isEnabled}): ${response.reason}`);
        }
    }

    /**
     * Enable/disable token transfer
     * @param isEnabled boolean
     */
    public async enableTransfer(isEnabled: boolean) {
        const response = await this.vdaWeb3Client!.enableTransfer(isEnabled);
        if (response.success !== true) {
            throw new Error(`Failed to enable transfer(${isEnabled}): ${response.reason}`);
        }
    }

    /**
     * Pause the contract
     */
    public async pause() {
        const response = await this.vdaWeb3Client!.pause();
        if (response.success !== true) {
            throw new Error(`Failed to pause contract: ${response.reason}`);
        }
    }

    /**
     * Unpause the contract
     */
    public async unpause() {
        const response = await this.vdaWeb3Client!.unpause();
        if (response.success !== true) {
            throw new Error(`Failed to unpause contract: ${response.reason}`);
        }
    }

}