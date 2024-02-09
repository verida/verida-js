export interface ClaimType {
    id: string
    reward: bigint
    schema: string
}

export const CLAIM_TYPES : ClaimType[] = [
    {
        id: "facebook",
        reward: 100n,
        schema: "https://common.schemas.verida.io/social/creds/facebook"
    },
    {
        id: "twitter",
        reward: 150n,
        schema: "https://common.schemas.verida.io/social/creds/twitter"
    },
]
