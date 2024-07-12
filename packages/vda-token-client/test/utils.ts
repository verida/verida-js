import { BlockchainAnchor } from "@verida/types"
import { VeridaTokenOwner } from "../src"
import { BigNumber, Wallet } from "ethers";

export interface IMintInformation {
    to: string
    amount: BigNumber
}

export const mintToken = async (ownerPrivateKey: string, blockchainAnchor: BlockchainAnchor, info: IMintInformation[], rpcUrl?: string) => {
    const tokenOwner = await VeridaTokenOwner.CreateAsync({
        blockchainAnchor,
        privateKey: ownerPrivateKey,
        rpcUrl
    });

    const contractOwner = await tokenOwner.owner();
    const curKeyAddress = new Wallet(ownerPrivateKey).address;

    if (contractOwner.toLowerCase() !== curKeyAddress.toLowerCase()) {
        throw new Error(`Incorrect owner private key`);
    }

    for (let i = 0; i < info.length; i++) {
        await tokenOwner.mint(info[i].to, info[i].amount);
    }
}

// export const 