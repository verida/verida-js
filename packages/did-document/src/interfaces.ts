import { Interfaces } from "@verida/storage-link"
import { DIDDocument as DD } from 'did-resolver'

export interface Proof {
    type: 'EcdsaSecp256k1VerificationKey2019',
    verificationMethod: string,
    proofPurpose: 'assertionMethod'
    proofValue: string
}

export interface DIDDocumentStruct extends DD {
    proof?: Proof
}

export interface Endpoints {
    database: Interfaces.SecureContextEndpoint,
    messaging: Interfaces.SecureContextEndpoint,
    storage?: Interfaces.SecureContextEndpoint,
    notification?: Interfaces.SecureContextEndpoint,
}

export enum EndpointType {
    DATABASE = 'database',
    MESSAGING = 'messaging',
    STORAGE = 'storage',
    NOTIFICATION = 'notification'
}