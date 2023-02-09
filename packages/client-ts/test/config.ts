import { AccountNodeDIDClientConfig, EnvironmentType } from "@verida/types"

const ENDPOINTS = ['https://node1-apse2.devnet.verida.tech:443/', 'https://node2-apse2.devnet.verida.tech:443/', 'https://node3-apse2.devnet.verida.tech:443/']

const DID_ENDPOINTS: string[] = []
for (let e in ENDPOINTS) {
    DID_ENDPOINTS.push(`${ENDPOINTS[e]}did/`)
}

export default {
    ENVIRONMENT: EnvironmentType.TESTNET,
    VDA_PRIVATE_KEY:   '0x20d3b996ec98a9a536efdffbae10e5eaaf11a765a587483c69195c9460165d38',
    VDA_PRIVATE_KEY_2: '0x20d3b996ec98a9a536efdffbae10f5eaaf11a765a587483c69195c9460165d38',
    VDA_PRIVATE_KEY_3: '0x20d3b996ec98a91536efdffbae10f5eaaf11a765a587483c69195c9460165d38',
    CONTEXT_NAME: 'Verida Test: Test Application 1',
    DATABASE_SERVER: 'https://node1-apse2.devnet.verida.tech/',  // http://localhost:5000/ for local testing when running local @verida/storage-node
    MESSAGE_SERVER: 'https://node1-apse2.devnet.verida.tech/',  // http://localhost:5000/ for local testing when running local @verida/storage-node
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
        didEndpoints: DID_ENDPOINTS
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