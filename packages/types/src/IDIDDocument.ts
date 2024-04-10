import { ServiceEndpoint, Service } from 'did-resolver'
import { SecureContextEndpoints, SecureContextEndpointType, VeridaDocInterface } from "./DocumentInterfaces"
import { IKeyring } from './IKeyring'
import { EnvironmentType } from './NetworkInterfaces'

export interface IDIDDocument {
    get id(): string

    getErrors(): string[] 

    addContext(environment: EnvironmentType, contextName: string, keyring: IKeyring, privateKey: string, endpoints: SecureContextEndpoints): Promise<void>

    removeContext(contextName: string, environment?: EnvironmentType): boolean 

    setAttributes(attributes: Record<string, any>): void

    import(doc: VeridaDocInterface): void

    export(): VeridaDocInterface 

    addContextService(environment: EnvironmentType, contextHash: string, endpointType: SecureContextEndpointType, serviceType: string, endpointUris: ServiceEndpoint[]): void

    addContextSignKey(environment: EnvironmentType, contextHash: string, publicKeyHex: string, proof: string): void

    addContextAsymKey(environment: EnvironmentType, contextHash: string, publicKeyHex: string): void

    verifySig(data: any, signature: string): boolean 

    verifyContextSignature(data: any, environment: EnvironmentType, contextName: string, signature: string, contextIsHash: boolean): boolean

    locateServiceEndpoint(contextName: string, endpointType: SecureContextEndpointType, environment?: EnvironmentType): Service | undefined

    locateContextProof(contextName: string, environment: EnvironmentType): string | undefined

    signProof(privateKey: Uint8Array | string): void

    verifyProof(): boolean

    buildTimestamp(date: Date): string
}