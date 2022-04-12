import { EnvironmentType } from "./interfaces"

const config: any = {
    environments: {}
}

config.environments[EnvironmentType.LOCAL] = {
    didServerUrl: 'http://localhost:5001'
}

config.environments[EnvironmentType.TESTNET] = {
    didServerUrl: 'https://dids.testnet.verida.io:5001'
}

/*config.environments[EnvironmentType.MAINNET] = {
    didServerUrl: 'https://dids.verida.io:5001'
}*/

export default config
