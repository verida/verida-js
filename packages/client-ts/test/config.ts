import { EnvironmentType } from "@verida/account"
import { DIDClientConfig } from '@verida/account-node'

const ENDPOINTS = ['https://acacia-dev1.tn.verida.tech/', 'https://acacia-dev2.tn.verida.tech/', 'https://acacia-dev3.tn.verida.tech/']
//const ENDPOINTS = ['https://acacia-au-dev1.tn.verida.tech/', 'https://acacia-au-dev2.tn.verida.tech/', 'https://acacia-au-dev3.tn.verida.tech/']

const DID_ENDPOINTS: string[] = []
for (let e in ENDPOINTS) {
    DID_ENDPOINTS.push(`${ENDPOINTS[e]}did/`)
}

export default {
    ENVIRONMENT: EnvironmentType.TESTNET,
    VDA_PRIVATE_KEY:   '0x04d3b996ec98a9a536efdffbae10e5eaaf11a765a587483c69195c9460165d38',
    VDA_PRIVATE_KEY_2: '0x04d3b996ec98a9a536efdffbae10f5eaaf11a765a587483c69195c9460165d38',
    VDA_PRIVATE_KEY_3: '0x04d3b996ec98a91536efdffbae10f5eaaf11a765a587483c69195c9460165d38',
    CONTEXT_NAME: 'Verida Test: Test Application 1',
    DATABASE_SERVER: 'https://acacia-dev1.tn.verida.tech/',  // http://localhost:5000/ for local testing when running local @verida/storage-node
    MESSAGE_SERVER: 'https://acacia-dev1.tn.verida.tech/',  // http://localhost:5000/ for local testing when running local @verida/storage-node
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
    DID_CLIENT_CONFIG: <DIDClientConfig> {
        callType: 'web3',
        web3Config: {
            privateKey: '383b7ac8d2f4eb6693b2bc8de97d26c69a50f7b10520e11ea97b4f95dd219967',
            rpcUrl: 'https://rpc-mumbai.maticvigil.com/'
        },
        didEndpoints: DID_ENDPOINTS
    },
    INVALID_ENDPOINTS: {    // endpoints that resolve to non-existant storage node
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