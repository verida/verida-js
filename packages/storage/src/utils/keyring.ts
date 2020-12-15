import { box, sign } from "tweetnacl"
const bs58 = require('bs58')
const jsSHA = require("jssha")
import Encryption from '@verida/encryption-utils'

import { KeyringKeyType } from '../interfaces'

/**
 * @todo: Use verida encryption-utils, rename to StorageKeyring?
 * @future: Update encryption-utils to use `digitalbazaar/minimal-cipher` for asym encryption
 */

export default class StorageKeyring {

    private seed: string

    public asymKeyPair?: any    // should be nacl.box.KeyPair
    public signKeyPair?: any    // should be nacl.box.KeyPair
    public symKey?: Uint8Array

    //constructor(asymKey, signKey, databaseUri) {
    constructor(seed: string) {
        this.seed = seed
    }

    public async _init() {
        this.asymKeyPair = await this.buildKey(this.seed, KeyringKeyType.ASYM)
        this.signKeyPair = await this.buildKey(this.seed, KeyringKeyType.SYM)
        const symKeyPair = await this.buildKey(this.seed, KeyringKeyType.SYM)
        this.symKey = symKeyPair.secretKey
    }

    private async buildKey(seed: string, keyType: KeyringKeyType): Promise<nacl.BoxKeyPair | nacl.SignKeyPair> {
        const inputMessage = `${seed}-${keyType}`

        const hash = new jsSHA('SHA-256', 'TEXT')
        hash.update(inputMessage)
        const hashBytes = hash.getHash('UINT8ARRAY')

        switch (keyType) {
            case KeyringKeyType.SIGN:
                return sign.keyPair.fromSeed(hashBytes)
            case KeyringKeyType.ASYM:
                return box.keyPair.fromSecretKey(hashBytes)
            case KeyringKeyType.SYM:
                return box.keyPair.fromSecretKey(hashBytes)
            default:
                throw new Error('Unknown key type specified')
        }
    }

    public async publicKeys() {
        await this._init()
        
        return {
            asymPublicKey: this.asymKeyPair?.publicKey,
            asymPublicKeyBase58: bs58.encode(this.asymKeyPair?.publicKey),
            signPublicKey: this.signKeyPair?.publicKey,
            signPublicKeyBase58: bs58.encode(this.signKeyPair?.publicKey)
        }
    }

    public sign(data: string): string {
        return Encryption.signData(data, this.signKeyPair!.secretKey)
    }

    public symEncrypt(data: string) {
        return Encryption.symEncrypt(data, this.symKey!)
    }

    public symDecrypt(data: string) {
        return Encryption.symDecrypt(data, this.symKey!)
    }

    public asymEncrypt(data: string, secretOrSharedKey: Uint8Array) {
        return Encryption.asymEncrypt(data, secretOrSharedKey)
    }

    public asymDecrypt(messageWithNonce: string, secretOrSharedKey: Uint8Array) {
        return Encryption.asymDecrypt(messageWithNonce, secretOrSharedKey)
    }

    public buildSharedKeyStart(privateKey: Uint8Array) {
        return box.before(this.asymKeyPair!.publicKey, privateKey);
    }

    public buildSharedKeyEnd(publicKey: Uint8Array) {
        return box.before(publicKey, this.asymKeyPair!.secretKey);
    }

    //getDataServer(): DataServer   -- new StorageDataserver(did, uri, symKey, signkey)
    //setDataServer(uri)
    
}