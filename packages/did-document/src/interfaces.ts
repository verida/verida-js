import { DIDDocument as DocInterface} from 'did-resolver'
export interface SecureContextEndpoint {
    type: string;
    endpointUri: string;
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