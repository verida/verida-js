import { ethers, BigNumber, Wallet, BigNumberish, BytesLike } from 'ethers';
import { VeridaNodeOwnerApi, VeridaNodeManager } from '../src';
import { EnvironmentType, EnumStatus } from "@verida/types";
import { TRUSTED_SIGNER, REGISTERED_DATACENTERS, DID_NODE_MAP, REGISTERED_DIDS, REMOVED_DATACENTERS, FALLBACK_DIDS, REMOVE_START_DIDS } from "@verida/vda-common-test"
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

export type FallbackNodeInfoStruct = {
    fallbackNodeAddress: string;
    availableSlots: BigNumberish;
    fallbackProofTime: BigNumberish;
    availableSlotsProof: BytesLike;
};

/**
 * Get fallback node information
 * @param user Fallback node owner
 * @param node fallback node
 * @param signer Signer that signs the message. This parameter is for testing invalid signature tests.
 * @returns fallback node information for `removeNodeStart()` function
 */
export const getFallbackNodeInfo = (
    user:Wallet , 
    slotCount: BigNumberish, 
    signer: Wallet|undefined = undefined
    ) : FallbackNodeInfoStruct => {
    const timeInSec = Math.floor(Date.now() / 1000);

    const rawmsg = ethers.utils.solidityPack(
        ["address", "string", "uint", "string", "uint"],
        [user.address, "/", slotCount, "/", timeInSec]
    );
    if (signer === undefined) {
        signer = user;
    }

    const privateKeyBuffer = new Uint8Array(Buffer.from(signer.privateKey.slice(2), 'hex'));
    const signature = EncryptionUtils.signData(rawmsg, privateKeyBuffer);

    return {
        fallbackNodeAddress: user.address,
        availableSlots: slotCount,
        fallbackProofTime: timeInSec,
        availableSlotsProof: signature
    };
}

/**
 * Get migration proof for `removeNodeComplete()` function
 * @param nodeAddress Addres of node that will be removed
 * @param fallbackNodeAddress The address of fallback node
 * @param signer Signer of the message
 */
export const getFallbackMigrationProof = (nodeAddress: string, fallbackNodeAddress:string, signer: Wallet) => {
    const rawmsg = ethers.utils.solidityPack(
        ["address", "string", "address", "string"],
        [nodeAddress, "/", fallbackNodeAddress, "-migrated"]
    );
    const privateKeyBuffer = new Uint8Array(Buffer.from(signer.privateKey.slice(2), 'hex'));
    return EncryptionUtils.signData(rawmsg, privateKeyBuffer);
}

/**
 * Add data centers if not registered yet
 * @param ownerApi Owenr API
 * @param dataCenters Array of data centers
 */
async function checkAndAddDataCenters(ownerApi : VeridaNodeOwnerApi, dataCenters: any[]) : Promise<string[]> {
    const names : string[] = [];
    for (let i = 0; i < dataCenters.length; i++) {
        let result = await ownerApi.isRegisteredDataCenterName(dataCenters[i].name);
        if (result === false) {
            await ownerApi.addDataCenter(
                dataCenters[i].name,
                dataCenters[i].countryCode,
                dataCenters[i].regionCode,
                dataCenters[i].lat,
                dataCenters[i].long
            );
        }
        names.push(dataCenters[i].name);
    }
    return names
}

/**
 * Add storage nodes if not registered yet
 * @param configuration Configuration to create a `NodeManager`
 * @param nodes Array of DIDInteface
 */
async function checkAndAddNodes(configuration : Record<string, any>, nodes: any[]) {
    const trustedSignerWallet = new Wallet(TRUSTED_SIGNER.privateKey);
    for (let i = 0; i < nodes.length; i++) {
        const userNodeAPI = createNodeManager(
            nodes[i],
            configuration
        );

        const NODE_DATA = DID_NODE_MAP.get(nodes[i].address);

        const isRegistered = await userNodeAPI.isRegisteredNodeAddress();
        if (isRegistered === false) {
            const didWallet = new Wallet(nodes[i].privateKey);
            const authSignature = generateAuthSignature(didWallet, trustedSignerWallet);
            await userNodeAPI.addNode(
                NODE_DATA.name,
                NODE_DATA.endpointUri,
                NODE_DATA.countryCode,
                NODE_DATA.regionCode,
                NODE_DATA.datacenterId,
                NODE_DATA.lat,
                NODE_DATA.long,
                NODE_DATA.slotCount,
                NODE_DATA.acceptFallbackSlots,
                authSignature
            );
        }
    }
}

/**
 * Add storage nodes if not registered yet.
 * Will throw an error if the node is not registered.
 * @param configuration Configuration to create a `NodeManager`
 * @param nodes Array of DIDInteface
 */
async function CheckAndRemoveNodes(configuration : Record<string, any>, dids: any[], unregisterTime: BigNumberish, fallbackInfo: FallbackNodeInfoStruct) {
    for (let i = 0; i < dids.length; i++) {
        const userNodeAPI = createNodeManager(
            dids[i],
            configuration
        );

        const NODE_DATA = await userNodeAPI.getNodeByAddress();

        if (NODE_DATA!.status === EnumStatus.active) {
            await userNodeAPI.removeNodeStart(unregisterTime, fallbackInfo)
        }
    }
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

    console.log("Add initial data for test...")
    // Add trusted Signer
    if ((await ownerApi.isTrustedSigner(TRUSTED_SIGNER.address)) !== true) {
        try {
            await ownerApi.addTrustedSigner(TRUSTED_SIGNER.address);
        } catch (err) {
            throw new Error(`Failed to add trusted signer ${err}`);
        }
    }
    console.log("### Trusted signer added");

    // Check & add data centers if not added
    let DATA_CENTER_IDS : BigNumber[];
    try {
        // Add registered data centers
        const names = await checkAndAddDataCenters(ownerApi, REGISTERED_DATACENTERS);
        
        // Add and remove datacenters for test
        await checkAndAddDataCenters(ownerApi, REMOVED_DATACENTERS);

        const removeNames = REMOVED_DATACENTERS.map(item => item.name);
        const removeDataCenters = await ownerApi.getDataCentersByName(removeNames);
        for (let i = 0; i < removeDataCenters.length; i++) {
            if (removeDataCenters[i].status === EnumStatus.active) {
                await ownerApi.removeDataCenterByName(removeDataCenters[i].name);
            }
        }

        // Get IDs of registered data centers
        DATA_CENTER_IDS = await ownerApi.getDataCentersByName(names);
        DATA_CENTER_IDS = DATA_CENTER_IDS.map(item => item["id"]);
    } catch (err) {
        throw new Error(`Failed to add data centers ${err}`);
    }
    console.log("### Data centers are added")

    // Check & add nodes
    await checkAndAddNodes(configuration, REGISTERED_DIDS);

    // Remove nodes
    const fallbackUser = new Wallet(FALLBACK_DIDS[0].privateKey);
    const fallbackNodeInfo = DID_NODE_MAP.get(FALLBACK_DIDS[0].address);
    const fallbackInfo = getFallbackNodeInfo(fallbackUser, fallbackNodeInfo.slotCount);
    const now = Math.floor(Date.now() / 1000);
    const unregisterTime = now + 30 * 24 * 60 * 60;
    await CheckAndRemoveNodes(configuration, REMOVE_START_DIDS, unregisterTime, fallbackInfo);
    console.log("### Nodes are added");

    return DATA_CENTER_IDS;
}

export const compareNodeData = (org: any, result: any) => {
    let ret = false;
    
    try {
        ret = org.name === result.name &&
            org.endpointUri === result.endpointUri &&
            org.countryCode === result.countryCode && 
            org.regionCode === result.regionCode &&
            org.datacenterId === result.datacenterId &&
            org.lat === result.lat &&
            org.long === result.long &&
            // org.slotCount === result.slotCount &&
            org.acceptFallbackSlots === result.acceptFallbackSlots;
    } catch (err) {
        console.log(err)
    }
    return ret;
}