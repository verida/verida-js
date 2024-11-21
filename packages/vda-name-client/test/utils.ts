import { BlockchainAnchor } from "@verida/types";
import { DID_LIST, ERC20Manager, getBlockchainAPIConfiguration } from "@verida/vda-common-test";
import { VeridaNameClient, VeridaNameOwnerApi } from "../src";
import { getContractInfoForBlockchainAnchor } from "@verida/vda-common";
import { BigNumber, Wallet } from "ethers";

export const BLOCKCHAIN_ANCHOR = process.env.BLOCKCHAIN_ANCHOR !== undefined ? BlockchainAnchor[process.env.BLOCKCHAIN_ANCHOR] : BlockchainAnchor.POLAMOY;

// V1 test data
export const DID_WALLET = new Wallet(DID_LIST[0].privateKey);
// {
//     address: '0xcD3EbA1884878c8a859D0452d45a8AbdB084e500',
//     privateKey: '0x4abef2602c6419a8d86d04179b48c8988c4047cf5dba7917ebac703998094cb3',
//     publicKey : '0x02c399cc41d4d511d0d8dcb41750aebdf893b03bf36ca6f579fb840da53a2d4af9'
// };
export const DID = `did:vda:${BLOCKCHAIN_ANCHOR}:${DID_WALLET.address}`;
export const REGISTERED_NAMES = [
    'verida-tahpot-1.vda'
];

/**
 * Add initial data for testing V1 features  in read-only mode
 * @param privateKey Private key of DID
 */
export const addInitialDataV1 = async (privateKey: string) => {
    const configuration = getBlockchainAPIConfiguration(privateKey);
    const blockchainApi = new VeridaNameClient({
        blockchainAnchor: BLOCKCHAIN_ANCHOR,
        did: DID,
        signKey: DID_WALLET.privateKey,
        ...configuration
    });

    await blockchainApi.register(REGISTERED_NAMES[0]);
}

// V2 test data
export interface IAppMetaData {
    key: string
    value: string
}

export const appDataNoDomain: IAppMetaData[] = [
    {
        key: "name",
        value: "message"
    }   
];

export const appDataWithDomain: IAppMetaData[] = [
    ...appDataNoDomain,
    {
        key: "domain",
        value: "verida_io"
    }
];

export const ZeroAddress: string = "0x0000000000000000000000000000000000000000";
export const TestTokenAddress = "0x322F0273D7f6eCd9EeBc6C800a6777d1b3EEB697";
export const DID_OWNER = "Owner 1";
export const DID_APP = "App 1";
export const DID_APP_DATA = appDataWithDomain;

export const APP_REGISTER_FEE = 500;

/**
 * Enable registering app and add one app to `DID`
 * @param ownerPrivateKey Private key of the owner wallet
 */
export const addInitialDataV2 = async (ownerPrivateKey: string) => {
    const configuration = getBlockchainAPIConfiguration(ownerPrivateKey);
    const nameOwnerApi = new VeridaNameOwnerApi({
        blockchainAnchor: BLOCKCHAIN_ANCHOR,
        did: DID,
        signKey: DID_WALLET.privateKey,
        ...configuration
    });

    const nameRegistryContractAddress = getContractInfoForBlockchainAnchor(BLOCKCHAIN_ANCHOR, "nameRegistry").address;

    let TOKEN_ADDRESS = await nameOwnerApi.getTokenAddress();
    if (TOKEN_ADDRESS.toLowerCase() === ZeroAddress.toLowerCase()) {
        await nameOwnerApi.setTokenAddress(TestTokenAddress);
        TOKEN_ADDRESS = await nameOwnerApi.getTokenAddress();
    }
    const tokenOwner = new ERC20Manager(
        TOKEN_ADDRESS,
        <string>process.env.RPC_URL,
        ownerPrivateKey
    );
    if ((<BigNumber>await tokenOwner.balanceOf(DID_WALLET.address)).lt(APP_REGISTER_FEE)) {
        await tokenOwner.mint(DID_WALLET.address, APP_REGISTER_FEE);
    }


    const appRegisterFee: BigNumber = await nameOwnerApi.getAppRegisterFee();
    if (appRegisterFee.eq(0)) {
        await nameOwnerApi.updateAppRegisterFee(APP_REGISTER_FEE);
    }

    if(!(await nameOwnerApi.isAppRegisterEnabled())) {
        await nameOwnerApi.setAppRegisterEnabled(true);
    }

    const result = await nameOwnerApi.getApp(DID_OWNER, DID_APP);
    if (result.length == 0) {
        // await nameOwnerApi.
        await tokenOwner.approve(nameRegistryContractAddress, APP_REGISTER_FEE);

        await nameOwnerApi.registerApp(DID_OWNER, DID_APP, DID_APP_DATA);
    }
}