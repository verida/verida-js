import { EnvironmentType } from "@verida/types"

const config: any = {
    environments: {}
}

config.environments[EnvironmentType.LOCAL] = {
    didServerUrl: 'http://localhost:5001'
}

config.environments[EnvironmentType.TESTNET] = {
    didServerUrl: 'https://dids.testnet.verida.io:5001'
}
export default config
