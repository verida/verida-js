import { IDIDDocument } from "./IDIDDocument";
import { Web3CallType, Web3MetaTransactionConfig, Web3SelfTransactionConfigPart, VdaDidEndpointResponses } from "./Web3Interfaces";


export interface IDIDClient {
    authenticate(
        veridaPrivateKey: string,
        callType: Web3CallType,
        web3Config: Web3SelfTransactionConfigPart | Web3MetaTransactionConfig,
        defaultEndpoints: string[]
    ): void

    authenticated(): boolean 

    getDid(): string | undefined 

    getPublicKey(): string | undefined 

    save(document: IDIDDocument): Promise<VdaDidEndpointResponses>

    getLastEndpointErrors(): VdaDidEndpointResponses

    get(did: string): Promise<IDIDDocument>

    getRpcUrl(): string
}