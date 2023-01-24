import { DefaultClientConfig, EnvironmentType } from "@verida/types"

const config: DefaultClientConfig = {
    environment: EnvironmentType.TESTNET,
    environments: {
        local: {
            schemaPaths: {
                '/': 'https://schemas.verida.io/',
                'https://schemas.verida.io/': 'https://schemas.testnet.verida.io/'
                //'https://schemas.verida.io/': 'http://localhost:5010/'
            }
        },
        testnet: {
            schemaPaths: {
                '/': 'https://schemas.verida.io/',
                'https://schemas.verida.io/': 'https://schemas.testnet.verida.io/'
            }
        },
        /*mainnet: {
            schemaPaths: {
                '/': 'https://schemas.verida.io/'
            }
        },*/
    },
    vaultAppName: "Verida: Vault"
}

export default config
