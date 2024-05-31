import { DID_LIST, TRUSTED_SIGNER } from "@verida/vda-common-test";
import { VeridaXPRewardOwnerApi } from "../src/blockchain/ownerApi";
import { EnvironmentType } from "@verida/types";
import { Wallet } from 'ethers';
import EncryptionUtils from `@verida/encryption-utils`;

/**
 * Add initial data that is used in testing
 * @param configuration Configuration to create ownerApi
 * @param ownerApi Optional. If not provided, create with above `configuration` param
 */
export async function addInitialData(
    configuration: Record<string, any>,
    ownerApi: VeridaXPRewardOwnerApi | undefined = undefined
) {
    if (ownerApi === undefined) {
        // ownerDID defined to ownerApi as write mode
        const owenrDID = DID_LIST[0];

        ownerApi = new VeridaXPRewardOwnerApi({
            did: owenrDID.address,
            network: EnvironmentType.TESTNET,
            ...configuration
        });
    }

    console.log("Check and add trusted signer...");
    if ((await ownerApi.isTrustedSigner(TRUSTED_SIGNER.address)) !== true) {
        await ownerApi.addTrustedSigner(TRUSTED_SIGNER.address);
    }

    console.log("Set conversion rate...");
    if ((await ownerApi.getConversionRate()) === 0) {
        await ownerApi.setConversionRate(0.05);
    }
}

/**
 * Get a proof that will be used in `claim()` and `claimToStorage()` functions
 * @param userAddress User wallet address that call the claiming functions
 * @param trustedSigner A trusted signer that is added to the `VDARewardContract`
 * @returns Bytearray
 */
export function generateProof(userAddress: string, trustedSigner: Wallet) {
    const proofMsg = `${trustedSigner.address}${userAddress}`.toLowerCase();
    const privateKeyArray = new Uint8Array(Buffer.from(trustedSigner.privateKey.slice(2), 'hex'));
    return EncryptionUtils.signData(proofMsg, privateKeyArray);
}