
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