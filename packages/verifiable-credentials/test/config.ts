import { AutoAccount } from '@verida/account-node';
import { Context, EnvironmentType, Network } from '@verida/client-ts';

export const config = {
    PRIVATE_KEY_1: "0x5dd84b6d500bcbc018cbc71b0407d694095755d91af42bd3442b2dfc96b1e0af",
    PRIVATE_KEY_2: "0x80d3b996ec98a91536efdffbae40f5eaaf117765a587483c69195c9460165c37",
    ISSUER_DID: 'did:vda:0xB3729982A2585544FD72c99CF3773a9c6baBD55c',
    SUBJECT_DID: 'did:vda:0xC2629982A2585544FD72c99CF3773a9c6baBD55c',
    ADDRESS_1: '0xB3729982A2585544FD72c99CF3773a9c6baBD55c',
    CREDENTIAL_DATA: {
        name: 'Vitalik Buterin',
        firstName: 'Vitalik',
        lastName: 'Buterin',
        email: 'me@vitalik.eth',
        schema: 'https://common.schemas.verida.io/social/contact/v0.1.0/schema.json'
    },
    INVALID_CREDENTIAL_DATA: {
        email: 'me',
        schema: 'https://common.schemas.verida.io/social/contact/v0.1.0/schema.json'
    },
    VERIDA_CONTEXT_NAME: "Verida: Credentials",
    VERIDA_EXPECTED_DATABASE: 'credential_public_encrypted',
    VERIDA_TESTNET_DEFAULT_SERVER: "https://db.testnet.verida.io:5002/",
    VALID_VERIDA_URI: `verida://did:vda:0xB3729982A2585544FD72c99CF3773a9c6baBD55c/0x42406d644c8e884be0f76ee05539cfba03eda65baa2bda33ecd364ce4d18047c/credential_public_encrypted/4f54db10-8b92-11ec-b09c-bf8dd364cfc7?key=9dc07aae40b856cecb7c257b73c7929532284f5be1c153916da754cf841bdb69`,
    VERIDA_URI: `verida://did:vda:0xB3729982A2585544FD72c99CF3773a9c6baBD55c/0x42406d644c8e884be0f76ee05539cfba03eda65baa2bda33ecd364ce4d18047c/credential_public_encrypted/6273bb80-596a-1331ec-ad0d-f3b4d6aec150?key=1f52db207c48b6c54f6692cb182c41bc3bd0805d0efdc9dcb25f15ade8639d5f`,
    INVALID_VC_JWT: `eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL2V4YW1wbGVzL3YxIl0sImlkIjoiIiwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCJdLCJpc3N1ZXIiOiJkaWQ6dmRhOjB4QjM3Mjk5ODJBMjU4NTU0NEZENzJjOTlDRjM3NzNhOWM2YmFCRDU1YyIsImlzc3VhbmNlRGF0ZSI6IjIwMjItMDItMTBUMDc6MDg6MTQuMDQwWiIsImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmV4YW1wbGU6ZWJmZWIxZjcxMmViYzZmMWMyNzZlMTJlYzIxIiwiYWx1bW5pT2YiOiJFeGFtcGxlIFVuaXZlcnNpdHkiLCJzY2hlbWEiOiJodHRwczovL2NvbW1vbi5zY2hlbWFzLnZlcmlkYS5pby9jcmVkZW50aWFsL3B1YmxpYy9kZWZhdWx0L3YwLjEuMC9zY2hlbWEuanNvbiJ9LCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9jb21tb24uc2NoZW1hcy52ZXJpZGEuaW8vY3JlZGVudGlhbC9wdWJsaWMvZGVmYXVsdC92MC4xLjAvc2NoZW1hLmpzb24iLCJ0eXBlIjoiSnNvblNjaGVtYVZhbGlkYXRvcjIwMTgifX0sInN1YiI6ImRpZDp2ZGE6MHhCMzcyOTk4MkEyNTg1NTQ0RkQ3MmM5OUNGMzc3M2E5YzZiYUJENTVjIiwiaXNzIjoiZGlkOnZkYToweEIzNzI5OTgyQTI1ODU1NDRGRDcyYzk5Q0YzNzczYTljNmJhQkQ1NWMifQ.U2awX7ff-hPzUmMo4_VT0N-ORrQcGsnVTS5azw1iIH-6axMorvl30irBRCdWbn07TDM9ESFeFDLEXLguEXQ50w`

}


export const connect = async (privateKey: string, contextHash?: string): Promise<Context> => {

    const context = await Network.connect({
        context: {
            name: contextHash || config.VERIDA_CONTEXT_NAME,
        },
        client: {
            environment: EnvironmentType.TESTNET,
        },
        account: new AutoAccount(
            {
                defaultDatabaseServer: {
                    type: 'VeridaDatabase',
                    endpointUri: config.VERIDA_TESTNET_DEFAULT_SERVER,
                },
                defaultMessageServer: {
                    type: 'VeridaMessage',
                    endpointUri: config.VERIDA_TESTNET_DEFAULT_SERVER,
                },
            },
            {
                privateKey: privateKey,
                environment: EnvironmentType.TESTNET,
            }
        ),
    });
    return context;
};