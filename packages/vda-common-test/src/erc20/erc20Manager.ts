import { BigNumberish, Contract, Wallet } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";

const ABI = require("./erc20.json");

// ERC20 contract function call
// Only in the test mode.
// To support Mainnet, should add gas configuration
export class ERC20Manager {
    protected contract : Contract;
    /**
     * 
     * @param address Contract address
     * @param rpc RPC url
     * @param signKey Privatekey of the wallet
     */
    constructor (
        address : string,
        rpc : string,
        signKey : string
    ) {
        const provider = new JsonRpcProvider(rpc)
        const txSigner = new Wallet(signKey, provider);

        this.contract = new Contract(address, ABI.abi, txSigner);
    }

    public async owner() {
        return await this.contract.owner();
    }

    public async totalSupply() {
        return await this.contract.totalSupply();
    }

    public async balanceOf(account: string) {
        return await this.contract.balanceOf(account);
    }

    public async transfer(to: string, amount: BigNumberish) {
        const transaction = await this.contract.transfer(to, amount);
        await transaction.wait();
    }

    public async allowance(owner: string, spender: string) {
        return await this.contract.allowance(owner, spender);
    }

    public async approve(spender: string, amount: BigNumberish) {
        const transaction = await this.contract.approve(spender, amount);
        await transaction.wait();
    }

    public async transferFrom(from: string, to : string, amount: BigNumberish) {
        const transaction = await this.contract.transferFrom(from, to, amount);
        await transaction.wait();
    }

    public async increaseAllowance(spender: string, amount: BigNumberish) {
        const transaction = await this.contract.increaseAllowance(spender, amount);
        await transaction.wait();
    }

    public async decreaseAllowance(spender : string, amount : BigNumberish) {
        const transaction = await this.contract.decreaseAllowance(spender, amount);
        await transaction.wait();
    }

    public async mint(to: string, amount: BigNumberish) {
        const transaction = await this.contract.mint(to, amount);
        await transaction.wait();
    }

    public async burn(amount: BigNumberish) {
        const transaction = await this.contract.burn(amount);
        await transaction.wait();
    }
}