require('dotenv').config();
import { DID_LIST, getBlockchainAPIConfiguration, ERC20Manager } from "@verida/vda-common-test"
import { VeridaRewardOwnerApi } from '../src/blockchain/ownerApi';
import { BlockchainAnchor } from "@verida/types";
import { addInitialData } from "./helpers";
import { Wallet } from 'ethers';
import { ClaimType } from "./const";

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const configuration = getBlockchainAPIConfiguration(privateKey);


const createOwnerAPI = () => {
    const ownerDID = DID_LIST[0];

    return new VeridaRewardOwnerApi({
        blockchainAnchor: BlockchainAnchor.DEVNET,
        did: ownerDID.address,
        ...configuration
    })
}

describe("Verida RewardOwnerApi Test", function() {
    this.timeout(100 * 1000)
    let ownerApi;

    before(async () => {
        ownerApi = createOwnerAPI();
        await addInitialData(configuration, ownerApi);
    })

    describe("Trusted signer test", () => {
        const newSigner = Wallet.createRandom();

        it("Add a trusted signer",async () => {
            let response = await ownerApi.isTrustedSigner(newSigner.address);
            assert.equal(response, false);

            await ownerApi.addTrustedSigner(newSigner.address);

            response = await ownerApi.isTrustedSigner(newSigner.address);
            assert.equal(response, true);
        })

        it("Remove a trusted signer",async () => {
            await ownerApi.removeTrustedSigner(newSigner.address);

            const response = await ownerApi.isTrustedSigner(newSigner.address);
            assert.equal(response, false);
        })
    })

    describe("ClaimType test", () => {
        const claimType : ClaimType = {
            id: "instagram",
            reward: 10n,
            schema: "https://common.schemas.verida.io/social/creds/instagram"
        }

        it("Add claim type",async () => {
            let response = await ownerApi.getClaimType(claimType.id);
            assert.equal(response, undefined);

            await ownerApi.addClaimType(claimType.id, claimType.reward, claimType.schema);

            response = await ownerApi.getClaimType(claimType.id);
            assert.equal(response.reward, claimType.reward);
        })

        it("Update claim type reward",async () => {
            const newReward = 20n;

            await ownerApi.updateClaimTypeReward(claimType.id, newReward)

            const response = await ownerApi.getClaimType(claimType.id);
            assert.equal(response.reward, newReward);
        })

        it("Remove claim type reward",async () => {
            await ownerApi.removeClaimType(claimType.id);
            
            const response = await ownerApi.getClaimType(claimType.id);
            assert.equal(response, undefined);
        })
    })
})