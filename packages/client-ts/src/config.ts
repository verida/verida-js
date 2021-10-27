
const config: any = {
    environment: process.env.VERIDA_ENVIRONMENT || "testnet",
    environments: {
        local: {
            // For core development
            didServerUrl: 'http://localhost:5001',
            defaultDatabaseServerUrl: "http://localhost:5000/",
            defaultMessageServerUrl: "http://localhost:5000/",
            schemaPaths: {
                '/': 'https://schemas.verida.io/',
                'https://schemas.verida.io/': 'https://schemas.testnet.verida.io/'
                //'https://schemas.verida.io/': 'http://localhost:5010/'
            }
        },
        testnet: {
            didServerUrl: 'https://dids.testnet.verida.io:5001',
            defaultDatabaseServerUrl: "https://db.testnet.verida.io:5002/",
            defaultMessageServerUrl: "https://db.testnet.verida.io:5002/",
            schemaPaths: {
                '/': 'https://schemas.verida.io/',
                'https://schemas.verida.io/': 'https://schemas.testnet.verida.io/'
            }
        },
        /*mainnet: {
            didServerUrl: 'https://dids.verida.io:5001',
            storageServerUrl: "https://dataserver.mainnet.verida.io:5000/",
            messageServerUrl: "https://dataserver.mainnet.verida.io:5000/",
            schemaPaths: {
                '/': 'https://schemas.verida.io/'
            }
        },*/
    },
    vaultAppName: "Verida: Vault"
}

export default config
