
export interface SendInboxMessageOptions {
    did: string
    message: string
    network: string
    privateKey: string
    subject: string

    sendContext: string
    receiveContext: string
}

export interface GetDIDDocumentOptions {
    did: string
}

export interface GetAccountInfoOptions {
    network: string
    privateKey: string
}

export interface CreateAccountOptions {
    network: string
    saveDID: boolean
}