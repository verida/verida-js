import { EnvironmentType } from "@verida/account"
import { DefaultClientConfig } from "./interfaces"

const config: DefaultClientConfig = {
    environment: EnvironmentType.TESTNET,
    environments: {
        local: {
            // For core development
            defaultDatabaseServerUrl: "http://localhost:5000/",
            defaultMessageServerUrl: "http://localhost:5000/",
            schemaPaths: {
                '/': 'https://schemas.verida.io/',
                'https://schemas.verida.io/': 'https://schemas.testnet.verida.io/'
                //'https://schemas.verida.io/': 'http://localhost:5010/'
            }
        },
        testnet: {
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
