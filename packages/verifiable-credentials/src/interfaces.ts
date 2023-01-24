import { Context } from "@verida/client-ts";

export interface credentialDateOptions {
    expirationDate?: string;
    issuanceDate?: string
}

export interface VCResult {
    item: any;
    result: any;
    did: string;
    veridaUri: string;
    publicUri: string;
}

export interface CreateCredentialJWT {
    options?: credentialDateOptions;
    subjectId: string;
    data: any;
    context: Context;
}

