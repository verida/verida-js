
export default {
    STORAGE_LINK_SCHEMA: 'kjzl6cwe1jw145l8jya7g6cuyluj17xlyc6t7p6iif12isbi1ppu5cuze4u3njc',
    CERAMIC_URL: 'https://ceramic-clay.3boxlabs.com',
    ETH_PRIVATE_KEY: '0x78d3b996ec98a9a536efdffbae40e5eaaf117765a587483c69195c9460165c33',
    ETH_PRIVATE_KEY_2: '0x78d3b996ec98a9a536efdffbae40f5eaaf117765a587483c69195c9460165c33',
    ETH_PRIVATE_KEY_3: '0x78d3b996ec98a91536efdffbae40f5eaaf117765a587483c69195c9460165c33',
    CONTEXT_NAME: 'My Test Application',
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
    }
}