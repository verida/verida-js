import { Signer } from "ethers";
import { IDIDDocument } from "./IDIDDocument";
import { Web3CallType, VeridaWeb3TransactionOptions, VdaDidEndpointResponses } from "./Web3Interfaces";


export interface IDIDClient {
    authenticate(
        signer: Signer,
        callType: Web3CallType,
        web3Config: VeridaWeb3TransactionOptions,
        defaultEndpoints: string[]
    ): Promise<void>

    authenticated(): boolean

    getDid(): string | undefined

    getPublicKey(): string | undefined

    save(document: IDIDDocument): Promise<VdaDidEndpointResponses>

    getLastEndpointErrors(): VdaDidEndpointResponses

    get(did: string): Promise<IDIDDocument>

    getRpcUrl(): string
}
