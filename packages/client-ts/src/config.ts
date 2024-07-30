import { DefaultClientConfig, Network } from "@verida/types"

const config: DefaultClientConfig = {
    network: Network.BANKSIA,
    environments: {
        "local": {
            schemaPaths: {
                '/': 'https://schemas.verida.io/',
                'https://schemas.verida.io/': 'https://schemas.testnet.verida.io/'
                //'https://schemas.verida.io/': 'http://localhost:5010/'
            }
        },
        "banksia": {
            schemaPaths: {
                '/': 'https://schemas.verida.io/',
                'https://schemas.verida.io/': 'https://schemas.testnet.verida.io/'
            },
            readOnlyDataApiUri: 'https://data.verida.network'
        },
        "myrtle": {
            schemaPaths: {
                '/': 'https://schemas.verida.io/'
            },
            readOnlyDataApiUri: 'https://data.verida.network'
        },
    },
    vaultAppName: "Verida: Vault"
}

export default config
