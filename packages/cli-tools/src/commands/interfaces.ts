
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

export interface GetProfileOptions {
    did: string
    contextName: string
    profileName: string
    fallbackContext: string
    ignoreCache: boolean
    networkFallback: boolean
}

export interface SetProfileOptions {
    privateKey: string
    contextName: string
    network: string
    name: string
    description: string
    country: string
}