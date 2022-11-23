import { EnvironmentType } from "@verida/account"
import { DIDClientConfig } from '@verida/account-node'

export default {
    ENVIRONMENT: EnvironmentType.TESTNET,
    VDA_PRIVATE_KEY:   '0x81d3b996ec98a9a536efdffbae40e5eaaf117765a587483c69195c9460165d39',
    VDA_PRIVATE_KEY_2: '0x82d3b996ec98a9a536efdffbae40f5eaaf117765a587483c69195c9460165d39',
    VDA_PRIVATE_KEY_3: '0x83d3b996ec98a91536efdffbae40f5eaaf117765a587483c69195c9460165d39',
    CONTEXT_NAME: 'Verida Test: Test Application 1',
    DATABASE_SERVER: 'https://sn-acacia1.tn.verida.tech/',  // http://localhost:5000/ for local testing when running local @verida/storage-node
    MESSAGE_SERVER: 'https://sn-acacia1.tn.verida.tech/',  // http://localhost:5000/ for local testing when running local @verida/storage-node
    DEFAULT_ENDPOINTS: {
        defaultDatabaseServer: {
            type: 'VeridaDatabase',
            endpointUri: 'http://localhost:5000/'
        },
        defaultMessageServer: {
            type: 'VeridaMessage',
            endpointUri: 'http://localhost:5000/'
        },
    },
    DID_CLIENT_CONFIG: <DIDClientConfig> {
        callType: 'web3',
        web3Config: {
            privateKey: '383b7ac8d2f4eb6693b2bc8de97d26c69a50f7b10520e11ea97b4f95dd219967'
        },
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