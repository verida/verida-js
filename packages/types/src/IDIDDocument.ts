import { ServiceEndpoint, Service } from 'did-resolver'
import { SecureContextEndpoints, SecureContextEndpointType, VeridaDocInterface } from "./DocumentInterfaces"
import { IKeyring } from './IKeyring'

export interface IDIDDocument {
    get id(): string

    getErrors(): string[] 

    addContext(contextName: string, keyring: IKeyring, privateKey: string, endpoints: SecureContextEndpoints): Promise<void>

    removeContext(contextName: string): boolean 

    setAttributes(attributes: Record<string, any>): void

    import(doc: VeridaDocInterface): void

    export(): VeridaDocInterface 

    addContextService(contextHash: string, endpointType: SecureContextEndpointType, serviceType: string, endpointUris: ServiceEndpoint[]): void

    addContextSignKey(contextHash: string, publicKeyHex: string, proof: string): void

    addContextAsymKey(contextHash: string, publicKeyHex: string): void

    verifySig(data: any, signature: string): boolean 

    verifyContextSignature(data: any, contextName: string, signature: string, contextIsHash: boolean): boolean

    locateServiceEndpoint(contextName: string, endpointType: SecureContextEndpointType): Service | undefined

    locateContextProof(contextName: string): string | undefined

    signProof(privateKey: Uint8Array | string): void

    verifyProof(): boolean

    buildTimestamp(date: Date): string
}