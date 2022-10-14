import { EnvironmentType } from "@verida/account"
import { DIDClientConfig } from '@verida/account-node'

export default {
    ENVIRONMENT: EnvironmentType.TESTNET,
    VDA_PRIVATE_KEY:   '0x81d3b996ec98a9a536efdffbae40e5eaaf117765a587483c69195c9460165d39',
    VDA_PRIVATE_KEY_2: '0x82d3b996ec98a9a536efdffbae40f5eaaf117765a587483c69195c9460165d39',
    VDA_PRIVATE_KEY_3: '0x83d3b996ec98a91536efdffbae40f5eaaf117765a587483c69195c9460165d39',
    CONTEXT_NAME: 'Verida Test: Test Application 1',
    DATABASE_SERVER: 'https://db.testnet.verida.io:5002/',  // http://localhost:5000/ for local testing when running local @verida/storage-node
    MESSAGE_SERVER: 'https://db.testnet.verida.io:5002/',  // http://localhost:5000/ for local testing when running local @verida/storage-node
    DEFAULT_ENDPOINTS: {
        defaultDatabaseServer: {
            type: 'VeridaDatabase',
            endpointUri: 'https://db.testnet.verida.io:5002/'
        },
        defaultMessageServer: {
            type: 'VeridaMessage',
            endpointUri: 'https://db.testnet.verida.io:5002/'
        },
    },
    DID_CLIENT_CONFIG: <DIDClientConfig> {
        networkPrivateKey: '',
        callType: 'web3',
        web3Config: {},
        //rpcUrl: ''
    },
    INVALID_ENDPOINTS: {    // endpoints that resolve to non-existant storage node
        defaultDatabaseServer: {
            type: 'VeridaDatabase',
            endpointUri: 'http://localhost:6000/'
        },
        defaultMessageServer: {
            type: 'VeridaMessage',
            endpointUri: 'http://localhost:6000/'
        },
    }
}