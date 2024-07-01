require('dotenv').config();
import { getBlockchainAPIConfiguration, ERC20Manager, TRUSTED_SIGNER } from "@verida/vda-common-test"
import { REGISTERED_DIDS as REGISTERED_NODE_DIDS, RECIPIENT_WALLET } from "@verida/vda-common-test"
import { BlockchainAnchor } from "@verida/types";
import { addInitialData, generateProof } from "./helpers";
import { Wallet, BigNumber } from 'ethers';
import { CLAIM_TYPES, ClaimType } from "./const";
import { VeridaRewardClient } from "../src/blockchain/userApi";

import { VeridaNodeManager } from "@verida/vda-node-manager";
import { getContractInfoForBlockchainAnchor } from "@verida/vda-common";

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const configuration = getBlockchainAPIConfiguration(privateKey);

const target_chain = BlockchainAnchor.DEVNET;

// Create `VeridaRewardClient` in write mode
const createRewardClientAPI = (did:Wallet, configuration: any) => {
    return new VeridaRewardClient({
        blockchainAnchor: target_chain,
        did: `did:vda:testnet:${did.address}`,
        signKey: did.privateKey,
        ...configuration
    })
}

const createNodeManagerAPI = () => {
    return new VeridaNodeManager({
        blockchainAnchor: target_chain,
        // did: did.address,
        // signKey: did.privateKey,
        // ...configuration
    })
}

describe("Verida RewardOwnerApi Test in read/write mode", () => {
    let rewardClientApi: VeridaRewardClient;
    let nodeManagerApi: VeridaNodeManager;
    let tokenAPI: ERC20Manager;

    let proof: string;

    before(async () => {
        await addInitialData(configuration);
        rewardClientApi = createRewardClientAPI(new Wallet(RECIPIENT_WALLET.privateKey), configuration);

        const TOKEN_ADDRESS = await rewardClientApi.getTokenAddress();
        const rewardContractAddress = getContractInfoForBlockchainAnchor(target_chain, "reward").address;

        // Create tokenAPI for claiming test
        tokenAPI = new ERC20Manager(
            TOKEN_ADDRESS,
            <string>process.env.RPC_URL,
            privateKey
        )

        // Create StorageNodeManager in read-only mode
        nodeManagerApi = createNodeManagerAPI();

        // Check out token amount of reward contract
        if (await tokenAPI.balanceOf(rewardContractAddress) < 1000n) {
            if (Boolean(process.env.NEED_TOKEN_MINT)) {
                const mintAmount = 1000n;
                await tokenAPI.mint(rewardContractAddress, mintAmount);
            } else {
                throw new Error(`Not enough token in the 'VDARewardContract' at ${rewardContractAddress}`);
            }            
        }

        // Generate proof
        proof = generateProof(RECIPIENT_WALLET.address, new Wallet(TRUSTED_SIGNER.privateKey));
    })

    describe("Get function tests", () => {
        it("Get claim type",async () => {
            // Get claim type for registered claim types
            for (let i = 0; i < CLAIM_TYPES.length; i++) {
                const response = await rewardClientApi.getClaimType(CLAIM_TYPES[i].id);
                assert.equal(response.reward, CLAIM_TYPES[i].reward);
            }

            // Return `undefined` for unregistered claim type
            const response = await rewardClientApi.getClaimType("unregistered-id");
            assert.equal(response, undefined);
        })


        it("Get token address",async () => {
            const response = await rewardClientApi.getTokenAddress();
            assert.ok(response && typeof(response) === `string`, 'Get the result');
        })
    
        it("Get `StorageNodeContract` address",async () => {
            const response = await rewardClientApi.getStorageNodeContractAddress();
            assert.ok(response && typeof(response) === `string`, 'Get the result');
        })
    
    })

    describe("Claim to an address", () => {
        const checkClaim =async (receiver: Wallet, claimInfo : ClaimType) => {
            const orgTokenBalance: BigNumber = await tokenAPI.balanceOf(receiver.address);

            // Claim
            const credential = "cred-" + Date.now();
            await rewardClientApi.claim(claimInfo.id, credential, receiver.address, proof);

            const curTokenBalance: BigNumber = await tokenAPI.balanceOf(receiver.address);
            assert.ok(curTokenBalance.eq(orgTokenBalance.add(claimInfo.reward)));
        }

        it("Claim to same DID of `RewardClientApi`",async () => {
            await checkClaim(new Wallet(RECIPIENT_WALLET.privateKey), CLAIM_TYPES[0]);
        })

        it("Claim to random address",async () => {
            const receiver = Wallet.createRandom();
            await checkClaim(receiver, CLAIM_TYPES[0]);
        })
    })

    describe("Claim to storage", () => {
        let storageNodeContractAddress: string;
        let registeredNodeDIDWallet = new Wallet(REGISTERED_NODE_DIDS[0].privateKey);

        const checkClaimToStorage =async (
            rewardApi: VeridaRewardClient, 
            expectedResult: boolean, 
            claimInfo: ClaimType, 
            proof: string,
            didAddress?: string
        ) => {
            const orgTokenBalance: BigNumber = await tokenAPI.balanceOf(storageNodeContractAddress);
            const orgDIDnodeBalance: BigNumber = await nodeManagerApi.getBalance(didAddress ?? registeredNodeDIDWallet.address);

            // Claim
            const credential = "cred-" + Date.now();
            try {
                if (!didAddress) {
                    await rewardApi.claimToStorage(claimInfo.id, credential, proof);
                } else {
                    await rewardApi.claimToStorage(claimInfo.id, credential, proof, didAddress);
                }
            } catch (e) {
                if (expectedResult === true) {
                    throw new Error(e);
                }
                return;
            }

            if (expectedResult === true) {
                const curTokenBalance: BigNumber = await tokenAPI.balanceOf(storageNodeContractAddress);
                const curDIDnodeBalance : BigNumber = await nodeManagerApi.getBalance(didAddress ?? registeredNodeDIDWallet.address);
                
                assert.ok(curTokenBalance.eq(orgTokenBalance.add(claimInfo.reward)));
                assert.ok(curDIDnodeBalance.eq(orgDIDnodeBalance.add(claimInfo.reward)));
            }
        }

        before(async () => {
            storageNodeContractAddress = await rewardClientApi.getStorageNodeContractAddress();
            //Verify `registeredNodeDID`
            assert.ok((await nodeManagerApi.isRegisteredNodeAddress(registeredNodeDIDWallet.address)) === true);

        })

        describe("`RewardClientApi` initialized with unregistered node DID", () => {
            before(async () => {
                assert.ok((await nodeManagerApi.isRegisteredNodeAddress(RECIPIENT_WALLET.address)) === false);
            })

            it("Success : To registered node-did",async () => {
                await checkClaimToStorage(rewardClientApi, true, CLAIM_TYPES[0], proof, registeredNodeDIDWallet.address);
            })

            it("Failed : To unregisterd node did",async () => {
                // To self
                await checkClaimToStorage(rewardClientApi, false, CLAIM_TYPES[0], proof);
                // To random address
                await checkClaimToStorage(rewardClientApi, false, CLAIM_TYPES[0], proof, Wallet.createRandom().address);
            })

        })
        
        describe("`RewardClientApi` initialized with registered node DID", () => {
            let rewardApi: VeridaRewardClient
            let proof: string
            before(() => {
                rewardApi = createRewardClientAPI(registeredNodeDIDWallet, configuration);
                proof = generateProof(registeredNodeDIDWallet.address, new Wallet(TRUSTED_SIGNER.privateKey));
            })

            it("Success : To registered node-did",async () => {
                // To self
                await checkClaimToStorage(rewardApi, true, CLAIM_TYPES[0], proof);
                // To registered node did
                await checkClaimToStorage(rewardApi, true, CLAIM_TYPES[0], proof, new Wallet(REGISTERED_NODE_DIDS[1].privateKey).address);
            })

            it("Failed : To unregistered node-did",async () => {
                await checkClaimToStorage(rewardApi, false, CLAIM_TYPES[0], proof, Wallet.createRandom().address);
            })

        })
    })
})