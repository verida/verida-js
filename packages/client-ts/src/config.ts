import { EnvironmentType } from "@verida/account"
import { DefaultClientConfig } from "./interfaces"

// @ts-ignore
const rpcUrls: Record<EnvironmentType, string> = {}
rpcUrls[EnvironmentType.LOCAL] = ""
rpcUrls[EnvironmentType.TESTNET] = "https://rpc-mumbai.maticvigil.com"
rpcUrls[EnvironmentType.MAINNET] = ""

const config: DefaultClientConfig = {
    environment: EnvironmentType.TESTNET,
    rpcUrls,
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
