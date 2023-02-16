import { IContext } from "@verida/types";

export const VERIDA_CREDENTIAL_SCHEMA = 'https://common.schemas.verida.io/credential/base/v0.2.0/schema.json'

export interface CreateCredentialOptions {
    expirationDate?: string;
    issuanceDate?: string;
    proofStrings?: Record<string, string[]>;
}

export interface VCResult {
    item: any;
    result: any;
    did: string;
    veridaUri: string;
    publicUri: string;
}

export interface CreateCredentialJWT {
    options?: CreateCredentialOptions;
    subjectId: string;
    data: any;
    schema: string;
    context: IContext;
    payload?: Record<string, any>;
}

export interface VeridaCredentialRecord {
    schema: string
    name: string
    summary?: string
    didJwtVc: string
    credentialSchema: string
    credentialData: Record<string, string | object>
}