import {AutoAccount} from '@verida/account-node';
import {Context, EnvironmentType, Network} from '@verida/client-ts';

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
    RAW_CREDENTIAL_DATA: {
        _id: "40dbc870-8fb9-11ec-b8da-4168ed4ebb55",
        name: "Your Dentist Credential",
        firstName: "Hien ",
        lastName: "Developer",
        regNumber: "SDKSJDPW120120",
        healthType: "Dentist",
        regExpDate: "2022-02-11",
        schema: "https://verida.github.io/demo-credential-issuer/mapay/v0.1.0/schema.json",
        testTimestamp: "2022-02-17T06:03:14.164Z",
        summary: "Credential issued at Thu Feb 17 2022",
        didJwtVc: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE2NDUwNzc3OTQsImV4cCI6bnVsbCwiYXVkIjoiZGlkOnZkYToweDc1NjZjNTc0NTI4N2E1ZDEyYkY3N2FBMTlEMTREZTRDNUVEMzhlMDQiLCJkYXRhIjp7Im5hbWUiOiJZb3VyIERlbnRpc3QgQ3JlZGVudGlhbCIsImZpcnN0TmFtZSI6IkhpZW4gIiwibGFzdE5hbWUiOiJEZXZlbG9wZXIiLCJyZWdOdW1iZXIiOiJTREtTSkRQVzEyMDEyMCIsImhlYWx0aFR5cGUiOiJEZW50aXN0IiwicmVnRXhwRGF0ZSI6IjIwMjItMDItMTEiLCJzY2hlbWEiOiJodHRwczovL3ZlcmlkYS5naXRodWIuaW8vZGVtby1jcmVkZW50aWFsLWlzc3Vlci9tYXBheS92MC4xLjAvc2NoZW1hLmpzb24iLCJ0ZXN0VGltZXN0YW1wIjoiMjAyMi0wMi0xN1QwNjowMzoxNC4xNjRaIiwic3VtbWFyeSI6IkNyZWRlbnRpYWwgaXNzdWVkIGF0IFRodSBGZWIgMTcgMjAyMiJ9LCJjb250ZXh0IjoiVmVyaWRhOiBWZXJpZmlhYmxlIENyZWRlbnRpYWwgRGVtbyIsImluc2VydGVkQXQiOiIyMDIyLTAyLTE3VDA2OjAzOjE0LjE2NVoiLCJpc3MiOiJkaWQ6dmRhOjB4NzU2NmM1NzQ1Mjg3YTVkMTJiRjc3YUExOUQxNERlNEM1RUQzOGUwNCJ9.WvDxVhKFq40okaWDEO53kat9YKAklVl6qEHAsQkOHw50QYhx61Emh8lA_DldgC0U8thnt4F0pGVnU86fo4ia8g",
        insertedAt: "2022-02-17T06:17:16.152Z",
        modifiedAt: "2022-02-17T06:17:16.152Z",
        signatures: {
          "did:vda:0x2c32E2341fF3726CE03D897946cAB5Eb268Ee1F0?context=0xe92a609ded204004bb1d128127147b6b3d5890b24434e74e42255c86607fe2ba": "0x6ea7cbed168504fd1dfeb407a76e0f9b57985a7689bd9678…3ae4a33a061297e672e8f0f7ef55acca7b5074c9ddaf8c81b"
        },
        _rev: "1-991fbeef5dc6c91efacb7e8a1732abc4"
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
