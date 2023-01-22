import { ServiceEndpoint } from 'did-resolver'
import { Endpoints, EndpointType, VeridaDocInterface } from "./DocumentInterfaces"
import { IKeyring } from './IKeyring'

export interface IDIDDocument {

    constructor(doc: VeridaDocInterface | string, publicKeyHex?: string): void

     get id(): string

     getErrors(): string[] 

      addContext(contextName: string, keyring: IKeyring, privateKey: string, endpoints: Endpoints): Promise<void>

     removeContext(contextName: string): boolean 

     setAttributes(attributes: Record<string, any>): void

     import(doc: VeridaDocInterface): void

     export(): VeridaDocInterface 

     addContextService(contextHash: string, endpointType: EndpointType, serviceType: string, endpointUris: ServiceEndpoint[]): void

     addContextSignKey(contextHash: string, publicKeyHex: string, proof: string): void

     addContextAsymKey(contextHash: string, publicKeyHex: string): void

 verifySig(data: any, signature: string): boolean 
 
 verifyContextSignature(data: any, contextName: string, signature: string, contextIsHash: boolean): boolean

      generateContextHash(did: string, contextName: string): string

     locateServiceEndpoint(contextName: string, endpointType: EndpointType): string | undefined

     locateContextProof(contextName: string): string | undefined

     signProof(privateKey: Uint8Array | string): void

     verifyProof(): boolean

     getProofData(): any

     buildTimestamp(date: Date): string

}