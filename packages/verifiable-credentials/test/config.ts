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
    INVALID_VERIDA_URI: `verida://did:vda:0xB3729982A2585544FD72c99CF3773a9c6baBD55c/0x42406d644c8e884be0f76ee05539cfba03eda65baa2bda33ecd364ce4d18047c/credential_public_encrypted/6273bb80-596a-1331ec-ad0d-f3b4d6aec150?key=1f52db207c48b6c54f6692cb182c41bc3bd0805d0efdc9dcb25f15ade8639d5f`,
    EXISTING_CREDENTIAL_URI: `verida://did:vda:0xB3729982A2585544FD72c99CF3773a9c6baBD55c/GpNDePvWU4RQud9jaZJiNwFyAS/credential_public_encrypted/6ccd0700-939c-11ec-9ac4-371a75288755?key=b572983d88023c3adda7a7f3066c817f2f1b404a7cedf4bae3b0dd09b9960c79`,
    RAW_CREDENTIAL_DATA:   {
        name: 'Vitalik Buterin',
        firstName: 'Vitalik',
        lastName: 'Buterin',
        email: 'me@vitalik.eth',
        schema: 'https://common.schemas.verida.io/social/contact/v0.1.0/schema.json',
        didJwtVc: 'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL2V4YW1wbGVzL3YxIl0sInN1YiI6ImRpZDp2ZGE6MHhDMjYyOTk4MkEyNTg1NTQ0RkQ3MmM5OUNGMzc3M2E5YzZiYUJENTVjIiwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCJdLCJpc3N1ZXIiOiJkaWQ6dmRhOjB4QjM3Mjk5ODJBMjU4NTU0NEZENzJjOTlDRjM3NzNhOWM2YmFCRDU1YyIsImlzc3VhbmNlRGF0ZSI6IjIwMjItMDItMjNUMDY6NDE6NTUuMDk3WiIsImNyZWRlbnRpYWxTdWJqZWN0Ijp7Im5hbWUiOiJWaXRhbGlrIEJ1dGVyaW4iLCJmaXJzdE5hbWUiOiJWaXRhbGlrIiwibGFzdE5hbWUiOiJCdXRlcmluIiwiZW1haWwiOiJtZUB2aXRhbGlrLmV0aCIsInNjaGVtYSI6Imh0dHBzOi8vY29tbW9uLnNjaGVtYXMudmVyaWRhLmlvL3NvY2lhbC9jb250YWN0L3YwLjEuMC9zY2hlbWEuanNvbiJ9LCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9jb21tb24uc2NoZW1hcy52ZXJpZGEuaW8vc29jaWFsL2NvbnRhY3QvdjAuMS4wL3NjaGVtYS5qc29uIiwidHlwZSI6Ikpzb25TY2hlbWFWYWxpZGF0b3IyMDE4In19LCJpc3MiOiJkaWQ6dmRhOjB4QjM3Mjk5ODJBMjU4NTU0NEZENzJjOTlDRjM3NzNhOWM2YmFCRDU1YyJ9.BdokafCkVKavdVM2UgAnCTY4pUlpQ02-7bi5FtKK0Wgvwo2xfpps17qa1iuWa9IsmzgYcB4R8SlBgpybQ5AW_w'
    }
}


export const connect = async (privateKey: string, customContexName?: string): Promise<Context> => {

    const context = await Network.connect({
        context: {
            name: customContexName || config.VERIDA_CONTEXT_NAME,
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
