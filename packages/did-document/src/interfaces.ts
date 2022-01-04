import { DIDDocument as DD } from 'did-resolver';

export interface SecureContextEndpoint {
  type: string;
  endpointUri: string;
  config?: object;
}

export interface Proof {
  type: 'EcdsaSecp256k1VerificationKey2019';
  verificationMethod: string;
  proofPurpose: 'assertionMethod';
  proofValue: string;
}

export interface DIDDocumentStruct extends DD {
  proof?: Proof;
}

export interface Endpoints {
  database: SecureContextEndpoint;
  messaging: SecureContextEndpoint;
  storage?: SecureContextEndpoint;
  notification?: SecureContextEndpoint;
}

export enum EndpointType {
  DATABASE = 'database',
  MESSAGING = 'messaging',
  STORAGE = 'storage',
  NOTIFICATION = 'notification',
}
