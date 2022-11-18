import { DIDDocument as DocInterface} from 'did-resolver'
export interface SecureContextEndpoint {
    type: string;
    endpointUri: string[];
    config?: object;
}

export interface Endpoints {
    database: SecureContextEndpoint,
    messaging: SecureContextEndpoint,
    storage?: SecureContextEndpoint,
    notification?: SecureContextEndpoint,
}

export enum EndpointType {
    DATABASE = 'database',
    MESSAGING = 'messaging',
    STORAGE = 'storage',
    NOTIFICATION = 'notification'
}

export interface ComparisonResult {
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