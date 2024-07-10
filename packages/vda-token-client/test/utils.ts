import { BlockchainAnchor } from "@verida/types"
import { VeridaTokenOwner } from "../src"
import { BigNumber, Wallet } from "ethers";

export const mintToken = async (ownerPrivateKey: string, amount: BigNumber, to?: string) => {
    const tokenOwner = await VeridaTokenOwner.CreateAsync({
        blockchainAnchor: BlockchainAnchor.DEVNET,
        privateKey: ownerPrivateKey
    });

    const contractOwner = await tokenOwner.owner();
    const curKeyAddress = new Wallet(ownerPrivateKey).address;

    if (contractOwner.toLowerCase() !== curKeyAddress.toLowerCase()) {
        throw new Error(`Incorrect owner private key`);
    }

    const recipient = to ?? contractOwner;
    await tokenOwner.mint(recipient, amount);
}

export const 