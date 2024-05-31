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
}