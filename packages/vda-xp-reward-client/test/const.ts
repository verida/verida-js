import { BlockchainAnchor } from "@verida/types"
import { DID_LIST } from "@verida/vda-common-test"
import { BytesLike } from "ethers"

/**
 * @notice This interface is part of `ClaimInfo` struct of `VDAXPReward` contract
 */
export interface ClaimInfo {
    typeId: string
    uniqueId: string
    issueYear: number
    issueMonth: number
    xp: bigint
    signature: BytesLike
    proof: BytesLike
}

export const Test_BlockchainAnchor = process.env.BLOCKCHAIN_ANCHOR !== undefined ? BlockchainAnchor[process.env.BLOCKCHAIN_ANCHOR] : BlockchainAnchor.POLAMOY;

export const CONTEXT_SIGNER = DID_LIST[1];
