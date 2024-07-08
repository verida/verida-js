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
     * Add a minter
     * @param minter Address
     */
    public async addMinter(minter: string) {
        const response = await this.vdaWeb3Client!.addMinter(minter);
        if (!response.success !== true) {
            throw new Error(`Failed to add a minter(${minter}): ${response.reason}`);
        }
    }

    public async revokeMinter(minter: string) {
        const response = await this.vdaWeb3Client!.revokeMinter(minter);
        if (!response.success !== true) {
            throw new Error(`Failed to revoke a minter(${minter}): ${response.reason}`);
        }
    }

    public async setAutomatedMarketMakerPair(pair: string, enabled: boolean) {
        const response = await this.vdaWeb3Client!.setAutomatedMarketMakerPair(pair, enabled);
        if (!response.success !== true) {
            throw new Error(`Failed to update the status of AMM pair(${pair}): ${response.reason}`);
        }
    }

    public async updateMaxAmountPerWalletRate(rate: BigNumber) {
        const response = await this.vdaWeb3Client!.updateMaxAmountPerWalletRate(rate);
        if (!response.success !== true) {
            throw new Error(`Failed to update the max amount rate per wallet: ${response.reason}`);
        }
    }

    public async updateMaxAmountPerSellRate(rate: BigNumber) {
        const response = await this.vdaWeb3Client!.updateMaxAmountPerSellRate(rate);
        if (!response.success !== true) {
            throw new Error(`Failed to update the max amount rate per sell: ${response.reason}`);
        }
    }

    public async excludeFromSellAmountLimit(address: string, isExcluded: boolean) {
        const response = await this.vdaWeb3Client!.excludeFromSellAmountLimit(address, isExcluded);
        if (!response.success !== true) {
            throw new Error(`Failed to exclude from sell amount limit(${address}): ${response.reason}`);
        }
    }

    public async excludeFromWalletAmountLimit(address: string, isExcluded: boolean) {
        const response = await this.vdaWeb3Client!.excludeFromWalletAmountLimit(address, isExcluded);
        if (!response.success !== true) {
            throw new Error(`Failed to exclude from wallet amount limit(${address}): ${response.reason}`);
        }
    }

    public async enableMaxAmountPerSell(isEnabled: boolean) {
        const response = await this.vdaWeb3Client!.enableMaxAmountPerSell(isEnabled);
        if (!response.success !== true) {
            throw new Error(`Failed to enable amount limit per sell(${isEnabled}): ${response.reason}`);
        }
    }

    public async enableMaxAmountPerWallet(isEnabled: boolean) {
        const response = await this.vdaWeb3Client!.enableMaxAmountPerWallet(isEnabled);
        if (!response.success !== true) {
            throw new Error(`Failed to enable amount limit per wallet(${isEnabled}): ${response.reason}`);
        }
    }

    public async enableTransfer(isEnabled: boolean) {
        const response = await this.vdaWeb3Client!.enableTransfer(isEnabled);
        if (!response.success !== true) {
            throw new Error(`Failed to enable transfer(${isEnabled}): ${response.reason}`);
        }
    }

    public async pause() {
        const response = await this.vdaWeb3Client!.pause();
        if (!response.success !== true) {
            throw new Error(`Failed to pause contract: ${response.reason}`);
        }
    }

    public async unpause() {
        const response = await this.vdaWeb3Client!.unpause();
        if (!response.success !== true) {
            throw new Error(`Failed to unpause contract: ${response.reason}`);
        }
    }

}