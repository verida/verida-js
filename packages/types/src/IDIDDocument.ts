import { ServiceEndpoint, Service } from 'did-resolver'
import { SecureContextEndpoints, SecureContextEndpointType, VeridaDocInterface } from "./DocumentInterfaces"
import { IKeyring } from './IKeyring'
import { Network } from './NetworkInterfaces'

export interface IDIDDocument {
    get id(): string

    getErrors(): string[] 

    addContext(network: Network, contextName: string, keyring: IKeyring, privateKey: string, endpoints: SecureContextEndpoints): Promise<void>

    removeContext(contextName: string, network?: Network): boolean 

    setAttributes(attributes: Record<string, any>): void

    import(doc: VeridaDocInterface): void

    export(): VeridaDocInterface 

    addContextService(network: Network, contextHash: string, endpointType: SecureContextEndpointType, serviceType: string, endpointUris: ServiceEndpoint[]): void

    addContextSignKey(network: Network, contextHash: string, publicKeyHex: string, proof: string): void

    addContextAsymKey(network: Network, contextHash: string, publicKeyHex: string): void

    verifySig(data: any, signature: string): boolean 

    verifyContextSignature(data: any, network: Network, contextName: string, signature: string, contextIsHash: boolean): boolean

    locateServiceEndpoint(contextName: string, endpointType: SecureContextEndpointType, network?: Network): Service | undefined

    locateContextProof(contextName: string, network: Network): string | undefined

    signProof(privateKey: Uint8Array | string): void

    verifyProof(): boolean

    buildTimestamp(date: Date): string
}