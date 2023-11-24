
import { ethers, BigNumber, Wallet } from 'ethers';
import { VeridaNodeOwnerApi, VeridaNodeManager } from '../src';
import { EnvironmentType } from "@verida/types";
import { TRUSTED_SIGNER, REGISTERED_DATACENTERS, DID_NODE_MAP, REGISTERED_DIDS } from "@verida/vda-common-test"
import EncryptionUtils from "@verida/encryption-utils";

const CONTRACT_DECIMAL = 9;

const createNodeManager = (did: any, configuration: any) => {
    return new VeridaNodeManager({
        did: did.address,
        signKey: did.privateKey,
        network: EnvironmentType.TESTNET,
        ...configuration
    })
}

/**
 * Generate a `authsignature` parameter used in `addNode()` function
 * @param user User wallet
 * @param signer Trusted Signer wallet that is registered as trusted signer in the contract
 * @returns Signature
 */
export function generateAuthSignature (user: Wallet, signer: Wallet) {
    const authMsg = ethers.utils.solidityPack(
        ['address'],
        [user.address]
    )
    const signerKeyBuffer = new Uint8Array(Buffer.from(signer.privateKey.slice(2), 'hex'));
    return EncryptionUtils.signData(authMsg, signerKeyBuffer);
}

export async function addInitialData (
    configuration : Record<string, any>,
    ownerApi : VeridaNodeOwnerApi | undefined = undefined,
    ){
    if (ownerApi === undefined) {
        const userDID = Wallet.createRandom();
        ownerApi = new VeridaNodeOwnerApi({
            did: `did:vda:testnet:${userDID.address}`, // Not used during owner function call
            signKey: userDID.privateKey, // Not used during owner function call
            network: EnvironmentType.TESTNET,
            ...configuration
        })
    }

    // Add trusted Signer
    if ((await ownerApi.isTrustedSigner(TRUSTED_SIGNER.address)) !== true) {
        try {
            await ownerApi.addTrustedSigner(TRUSTED_SIGNER.address);
        } catch (err) {
            throw new Error(`Failed to add trusted signer ${err}`);
        }
    }

    // Check & add data centers if not added
    let DATA_CENTER_IDS : BigNumber[];
    try {
        const names : string[] = [];

        for (let i = 0; i < REGISTERED_DATACENTERS.length; i++) {
            let result = await ownerApi.isDataCenterNameRegistered(REGISTERED_DATACENTERS[i].name);
            if (result === false) {
                await ownerApi.addDataCenter(
                    REGISTERED_DATACENTERS[i].name,
                    REGISTERED_DATACENTERS[i].countryCode,
                    REGISTERED_DATACENTERS[i].regionCode,
                    REGISTERED_DATACENTERS[i].lat,
                    REGISTERED_DATACENTERS[i].long
                );
            }
            names.push(REGISTERED_DATACENTERS[i].name);
        }

        // Get IDs of registered data centers
        DATA_CENTER_IDS = await ownerApi.getDataCentersByName(names);
        DATA_CENTER_IDS = DATA_CENTER_IDS.map(item => item["id"]);
    } catch (err) {
        throw new Error(`Failed to add data centers ${err}`);
    }

    // Check & add nodes
    const trustedSignerWallet = new Wallet(TRUSTED_SIGNER.privateKey);
    for (let i = 0; i < REGISTERED_DIDS.length; i++) {
        const userNodeAPI = createNodeManager(
            REGISTERED_DIDS[i],
            configuration
        );

        const NODE_DATA = DID_NODE_MAP.get(REGISTERED_DIDS[i].address);

        const node = await userNodeAPI.getNodeByEndpoint(NODE_DATA.endpointUri);
        if (node === undefined) {
            const didWallet = new Wallet(REGISTERED_DIDS[i].privateKey);
            const authSignature = generateAuthSignature(didWallet, trustedSignerWallet);
            await userNodeAPI.addNode(
                NODE_DATA.endpointUri,
                NODE_DATA.countryCode,
                NODE_DATA.regionCode,
                NODE_DATA.datacenterId,
                NODE_DATA.lat,
                NODE_DATA.long,
                NODE_DATA.slotCount,
                authSignature
            );
        }
    }
    return DATA_CENTER_IDS;
}

export const compareNodeData = (org: any, result: any) => {
    let ret = false;
    try {
        ret = org.endpointUri === result.endpointUri &&
            org.countryCode === result.countryCode && 
            org.regionCode === result.regionCode &&
            org.datacenterId === result.datacenterId &&
            org.lat === result.lat &&
            org.long === result.long;
    } catch (err) {
        console.log(err)
    }
    return ret;
}