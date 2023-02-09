
import { DIDDocument as DocInterface, ServiceEndpoint } from 'did-resolver'

export interface SecureContextEndpoint {
    type: string;
    endpointUri: ServiceEndpoint[];
    config?: object;
}

export interface SecureContextEndpoints {
    database: SecureContextEndpoint,
    messaging: SecureContextEndpoint,
    storage?: SecureContextEndpoint,
    notification?: SecureContextEndpoint,
}

export enum SecureContextEndpointType {
    DATABASE = 'database',
    MESSAGING = 'messaging',
    STORAGE = 'storage',
    NOTIFICATION = 'notification'
}

export interface DIDDocumentComparisonResult {
    controller?: string | string[];
    add: DocInterface;
    remove: DocInterface;
}

export enum VerificationMethodTypes {
    EcdsaSecp256k1VerificationKey2019 = "EcdsaSecp256k1VerificationKey2019",
    EcdsaSecp256k1RecoveryMethod2020 = "EcdsaSecp256k1RecoveryMethod2020",
    Ed25519VerificationKey2018 = "Ed25519VerificationKey2018",
    RSAVerificationKey2018 = "RSAVerificationKey2018",
    X25519KeyAgreementKey2019 = "X25519KeyAgreementKey2019",
}

export interface ProofInterface {
    type: string
    verificationMethod: string
    proofPurpose: string
    proofValue: string
}

/* Replace service with our custom one that supports array of serviceEndpoint */
export interface VeridaDocInterface extends DocInterface {
    versionId: number
    created?: string
    updated?: string
    deactivated?: string
    proof?: ProofInterface
}