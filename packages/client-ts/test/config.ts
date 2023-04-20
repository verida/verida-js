import { AccountNodeDIDClientConfig, EnvironmentType } from "@verida/types"

// Note: These default endpoints are now deprecated as `account-node` node server will automatically
// load them from the network.
// They are left here for when manual testing that uses specific nodes is required
const ENDPOINTS = ['https://node1-euw6.gcp.devnet.verida.tech:443/', 'https://node2-euw6.gcp.devnet.verida.tech:443/', 'https://node3-euw6.gcp.devnet.verida.tech:443/']

const DID_ENDPOINTS: string[] = []
for (let e in ENDPOINTS) {
    DID_ENDPOINTS.push(`${ENDPOINTS[e]}did/`)
}

export default {
    ENVIRONMENT: EnvironmentType.DEVNET,
    VDA_PRIVATE_KEY:   '',
    VDA_PRIVATE_KEY_2: '',
    VDA_PRIVATE_KEY_3: '',
    CONTEXT_NAME: 'Verida Test: Test Application 1',
    DATABASE_SERVER: 'https://node1-euw6.gcp.devnet.verida.tech/',  // http://localhost:5000/ for local testing when running local @verida/storage-node
    MESSAGE_SERVER: 'https://node1-euw6.gcp.devnet.verida.tech',  // http://localhost:5000/ for local testing when running local @verida/storage-node
    DEFAULT_ENDPOINTS: {
        defaultDatabaseServer: {
            type: 'VeridaDatabase',
            endpointUri: ENDPOINTS
        },
        defaultMessageServer: {
            type: 'VeridaMessage',
            endpointUri: ENDPOINTS
        },
    },
    DID_CLIENT_CONFIG: <AccountNodeDIDClientConfig> {
        callType: 'web3',
        web3Config: {
            privateKey: '',
            rpcUrl: 'https://rpc-mumbai.maticvigil.com/'
        },
        //didEndpoints: DID_ENDPOINTS
    },
    INVALID_ENDPOINTS: {    // endpoints that resolve to non-existent storage node
        defaultDatabaseServer: {
            type: 'VeridaDatabase',
            endpointUri: ['http://192.168.68.128:6000/']
        },
        defaultMessageServer: {
            type: 'VeridaMessage',
            endpointUri: ['http://192.168.68.128:6000/']
        },
    }
}