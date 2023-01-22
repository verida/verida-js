import { IDIDDocument } from "./IDIDDocument";
import { DIDClientConfig, VeridaSelfTransactionConfigPart } from "./NetworkInterfaces";
import { CallType, VdaDidEndpointResponse, VeridaMetaTransactionConfig } from "./Web3Interfaces";


export interface IDIDClient {

    constructor(config: DIDClientConfig): void
    
     authenticate(
        veridaPrivateKey: string,
        callType: CallType,
        web3Config: VeridaSelfTransactionConfigPart | VeridaMetaTransactionConfig,
        defaultEndpoints: string[]
    ): void

     authenticated(): boolean 

     getDid(): string | undefined 

     getPublicKey(): string | undefined 
    
      save(document: IDIDDocument): Promise<VdaDidEndpointResponse>

     getLastEndpointErrors(): string[]
    
      get(did: string): Promise<IDIDDocument>
    
}