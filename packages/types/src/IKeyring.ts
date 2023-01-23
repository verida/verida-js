
export interface IKeyring {
    getKeys(): Promise<any>

    _init(): Promise<void>

    publicKeys(): Promise<KeyringPublicKeys>

    sign(data: any): Promise<string> 

    verifySig(data: string, sig: string): Promise<boolean> 

    symEncrypt(data: string): Promise<string> 

    symDecrypt(data: string): Promise<any> 

    asymEncrypt(data: string, secretOrSharedKey: Uint8Array): Promise<string> 

    asymDecrypt(messageWithNonce: string, secretOrSharedKey: Uint8Array): Promise<any> 

    buildSharedKeyStart(privateKey: Uint8Array): Promise<Uint8Array> 

    buildSharedKeyEnd(publicKey: Uint8Array): Promise<Uint8Array> 

    getSeed(): string

    getStorageContextKey(databaseName: string): Promise<string> 
}

export interface KeyringPublicKeys {
    asymPublicKey: Uint8Array
    asymPublicKeyHex: string
    asymPublicKeyBase58: string
    signPublicKey: Uint8Array
    signPublicKeyHex: string
    signPublicKeyBase58: string
}

export enum KeyringKeyType {
    SIGN = 'sign',
    ASYM = 'asym',
    SYM = 'sym'
}