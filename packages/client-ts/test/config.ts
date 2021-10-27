import { EnvironmentType } from "@verida/account"

export default {
    DID_SERVER_URL: undefined,// 'http://localhost:5001',
    ENVIRONMENT: EnvironmentType.TESTNET,
    VDA_PRIVATE_KEY: '0x78d3b996ec98a9a536efdffbae40e5eaaf117765a587483c69195c9460165c36',
    VDA_PRIVATE_KEY_2: '0x78d3b996ec98a9a536efdffbae40f5eaaf117765a587483c69195c9460165c36',
    VDA_PRIVATE_KEY_3: '0x78d3b996ec98a91536efdffbae40f5eaaf117765a587483c69195c9460165c36',
    CONTEXT_NAME: 'Verida Test: Test Application 1',
    DATABASE_SERVER: 'http://localhost:5000/',  // http://localhost:5000/ for local testing when running local @verida/storage-node
    MESSAGE_SERVER: 'http://localhost:5000/',  // http://localhost:5000/ for local testing when running local @verida/storage-node
    DEFAULT_ENDPOINTS: {
        defaultDatabaseServer: {
            type: 'VeridaDatabase',
            endpointUri: 'http://localhost:5000/'
        },
        defaultMessageServer: {
            type: 'VeridaMessage',
            endpointUri: 'http://localhost:5000/'
        },
    }
}