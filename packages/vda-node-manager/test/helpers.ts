import { ethers, BigNumber, Wallet, BigNumberish, BytesLike } from 'ethers';
import { VeridaNodeOwnerApi, VeridaNodeManager } from '../src';
import { BlockchainAnchor, EnumStatus } from "@verida/types";
import { TRUSTED_SIGNER, REGISTERED_DATACENTRES, DID_NODE_MAP, REGISTERED_DIDS, REMOVED_DATACENTRES, FALLBACK_DIDS, REMOVE_START_DIDS, ERC20Manager, LOCK_LIST, REGISTERED_LOCK_NODE } from "@verida/vda-common-test"
import EncryptionUtils from "@verida/encryption-utils";
import { getContractInfoForBlockchainAnchor } from '@verida/vda-common';

const CONTRACT_DECIMAL = 9;
const TARGET_CHAIN = BlockchainAnchor.DEVNET;

const createNodeManager = (did: any, configuration: any) => {
    return new VeridaNodeManager({
        blockchainAnchor: TARGET_CHAIN,
        did: did.address,
        signKey: did.privateKey,
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
 * Add data centres if not registered yet
 * @param ownerApi Owenr API
 * @param dataCentres Array of data centres
 */
async function checkAndAddDataCentres(ownerApi : VeridaNodeOwnerApi, dataCentres: any[]) : Promise<string[]> {
    const names : string[] = [];
    for (let i = 0; i < dataCentres.length; i++) {
        let result = await ownerApi.isRegisteredDataCentreName(dataCentres[i].name);
        if (result === false) {
            await ownerApi.addDataCentre(
                dataCentres[i].name,
                dataCentres[i].countryCode,
                dataCentres[i].regionCode,
                dataCentres[i].lat,
                dataCentres[i].long
            );
        }
        names.push(dataCentres[i].name);
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
                NODE_DATA.datacentreId,
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

async function CheckAndLock(configuration : Record<string, any>, registeredLockNode: any) {
    const lockNodeApi = createNodeManager(registeredLockNode, configuration);

    const isRegistered = await lockNodeApi.isRegisteredNodeAddress();
    if (!isRegistered) {
        throw new Error("Node for locking test is not registered");
    }

    // Create Token manager for locking test
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('No PRIVATE_KEY in the env file');
    }
    const transactionSender = new Wallet(privateKey);

    const TOKEN_ADDRESS = await lockNodeApi.getVDATokenAddress();
    const tokenAPI = new ERC20Manager(
        TOKEN_ADDRESS,
        <string>process.env.RPC_URL,
        privateKey,
    );

    // Mint token for locking
    const lockTotalAmount = LOCK_LIST.reduce((acc, curInfo) => acc + curInfo.amount, 0);
    await tokenAPI.mint(transactionSender.address, lockTotalAmount);

    // Approve token for locking
    const nodeContractInfo = getContractInfoForBlockchainAnchor(TARGET_CHAIN, "storageNodeRegistry");
    await tokenAPI.approve(nodeContractInfo.address, lockTotalAmount);

    // Lock tokens with token transfer to the registered DID
    for (var lockInfo of LOCK_LIST) {
        const curLockedAmount = await lockNodeApi.locked(lockInfo.purpose);
        if (curLockedAmount < BigInt(lockInfo.amount))  {
            await lockNodeApi.lock(lockInfo.purpose, lockInfo.amount, true);
        }
    }
}

/**
 * Add test data to the `StorageNodeRegistry` contract
 * @param configuration Configuration to create `VeridaNodeOwnerApi`
 * @param ownerApi `VeridaNodeOwnerApi` instance
 * @returns 
 */
export async function addInitialData (
    configuration : Record<string, any>,
    ownerApi : VeridaNodeOwnerApi | undefined = undefined,
    ){
    if (ownerApi === undefined) {
        const userDID = Wallet.createRandom();
        ownerApi = new VeridaNodeOwnerApi({
            blockchainAnchor: TARGET_CHAIN,
            did: `did:vda:testnet:${userDID.address}`, // Not used during owner function call
            signKey: userDID.privateKey, // Not used during owner function call
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

    // Check & add data centres if not added
    let DATA_CENTRE_IDS : BigNumber[];
    try {
        // Add registered data centres
        const names = await checkAndAddDataCentres(ownerApi, REGISTERED_DATACENTRES);
        
        // Add and remove datacentres for test
        await checkAndAddDataCentres(ownerApi, REMOVED_DATACENTRES);

        const removeNames = REMOVED_DATACENTRES.map(item => item.name);
        const removeDataCentres = await ownerApi.getDataCentresByName(removeNames);
        for (let i = 0; i < removeDataCentres.length; i++) {
            if (removeDataCentres[i].status === EnumStatus.active) {
                await ownerApi.removeDataCentreByName(removeDataCentres[i].name);
            }
        }

        // Get IDs of registered data centres
        DATA_CENTRE_IDS = await ownerApi.getDataCentresByName(names);
        DATA_CENTRE_IDS = DATA_CENTRE_IDS.map(item => item["id"]);
    } catch (err) {
        throw new Error(`Failed to add data centres ${err}`);
    }
    console.log("### Data centres are added")

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

    await CheckAndLock(configuration, REGISTERED_LOCK_NODE);
    console.log("### Locking tokens done")

    return DATA_CENTRE_IDS;
}

/**
 * Compare node datas
 * @param org Former node data
 * @param result Latter node data
 * @returns true if equals, false otherwise
 */
export const compareNodeData = (org: any, result: any) => {
    let ret = false;
    
    try {
        ret = org.name === result.name &&
            org.endpointUri === result.endpointUri &&
            org.countryCode === result.countryCode && 
            org.regionCode === result.regionCode &&
            org.datacentreId === result.datacentreId &&
            org.lat === result.lat &&
            org.long === result.long &&
            // org.slotCount === result.slotCount &&
            org.acceptFallbackSlots === result.acceptFallbackSlots;
    } catch (err) {
        console.log(err)
    }
    return ret;
}