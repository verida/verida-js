import Encryption from '@verida/encryption-utils'
import nacl, { box, sign } from 'tweetnacl'
import { utils } from 'ethers'
import { IKeyring, KeyringKeyType, KeyringPublicKeys } from '@verida/types'

/**
 * Class that takes a signature (generated from a signed consent message) and generates a
 * collection of asymmetric keys, symmetric key and signing key for a given secure storage
 * context.
 */
export default class Keyring implements IKeyring {

    public asymKeyPair?: nacl.BoxKeyPair
    public signKeyPair?: nacl.SignKeyPair
    public symKey?: Uint8Array

    private seed: string
    private storageContextKeys: any = {}      // @todo proper typing

    /**
     * A string used as a seed for this keyring.
     * 
     * @param seed 
     */
    constructor(seed: string) {
        this.seed = seed
    }

    public async getKeys(): Promise<any> {
        await this._init()

        return {
            asymPublicKey: this.asymKeyPair!.publicKey,
            asymPublicAddress: utils.computeAddress(this.asymKeyPair!.publicKey),
            asymPrivateKey: this.asymKeyPair!.secretKey,
            asymPrivateKeyHex: utils.hexlify(this.asymKeyPair!.secretKey),
            asymPublicKeyBase58: utils.base58.encode(this.asymKeyPair!.publicKey),
            asymPrivateKeyBase58: utils.base58.encode(this.asymKeyPair!.secretKey),
            asymPublicKeyHex: utils.hexlify(this.asymKeyPair!.publicKey),
            signPublicKey: this.signKeyPair!.publicKey,
            signPublicAddress: utils.computeAddress(this.signKeyPair!.publicKey),
            signPrivateKey: this.signKeyPair!.secretKey,
            signPrivateKeyHex: utils.hexlify(this.signKeyPair!.secretKey),
            signPublicKeyBase58: utils.base58.encode(this.signKeyPair!.publicKey),
            signPrivateKeyBase58: utils.base58.encode(this.signKeyPair!.secretKey),
            signPublicKeyHex: utils.hexlify(this.signKeyPair!.publicKey),
            symKey: this.symKey!,
            symKeyHex: utils.hexlify(this.symKey!),
            symKeyBase58: utils.base58.encode(this.symKey!)
        }
    }

    public async _init() {
        if (this.asymKeyPair) {
            return
        }

        this.asymKeyPair = await this.buildKey(this.seed, KeyringKeyType.ASYM)
        this.signKeyPair = await this.buildKey(this.seed, KeyringKeyType.SIGN)

        const symmetricKey = await this.buildKey(this.seed, KeyringKeyType.SYM)
        this.symKey = symmetricKey.secretKey
    }

    /**
     * Helper function that generates a key of the appropriate type
     * 
     * @param seed 
     * @param keyType 
     * @returns 
     */
    private async buildKey(seed: string, keyType: KeyringKeyType): Promise<nacl.BoxKeyPair> {
        const inputMessage = `${seed}-${keyType}`
        const hashBytes = Encryption.hashBytes(inputMessage)

        switch (keyType) {
            case KeyringKeyType.SIGN:
                const hdnode = utils.HDNode.fromSeed(hashBytes)
                const secretKey = utils.zeroPad(hdnode.privateKey, 32)
                const publicKey = utils.zeroPad(hdnode.publicKey, 33)

                return {
                    secretKey,
                    publicKey
                }
            case KeyringKeyType.ASYM:
                return box.keyPair.fromSecretKey(hashBytes)
            case KeyringKeyType.SYM:
                return box.keyPair.fromSecretKey(hashBytes)
            default:
                throw new Error('Unknown key type specified')
        }
    }

    /**
     * Generate an object containing all the public keys for this Keyring
     * 
     * @returns 
     */
    public async publicKeys(): Promise<KeyringPublicKeys> {
        await this._init()

        return {
            asymPublicKey: this.asymKeyPair!.publicKey,
            asymPublicKeyHex: utils.hexlify(this.asymKeyPair!.publicKey),
            asymPublicKeyBase58: utils.base58.encode(this.asymKeyPair!.publicKey),
            signPublicKey: this.signKeyPair!.publicKey,
            signPublicKeyHex: utils.hexlify(this.signKeyPair!.publicKey),
            signPublicKeyBase58: utils.base58.encode(this.signKeyPair!.publicKey)
        }
    }

    public async sign(data: any): Promise<string> {
        await this._init()
        return Encryption.signData(data, this.signKeyPair!.secretKey)
    }

    public async verifySig(data: string, sig: string): Promise<boolean> {
        await this._init()
        return Encryption.verifySig(data, sig, utils.hexlify(this.signKeyPair!.publicKey))
    }

    public async symEncrypt(data: string): Promise<string> {
        await this._init()
        return Encryption.symEncrypt(data, this.symKey!)
    }

    public async symDecrypt(data: string): Promise<any> {
        await this._init()
        return Encryption.symDecrypt(data, this.symKey!)
    }

    public async asymEncrypt(data: string, secretOrSharedKey: Uint8Array): Promise<string> {
        await this._init()
        return Encryption.asymEncrypt(data, secretOrSharedKey)
    }

    public async asymDecrypt(messageWithNonce: string, secretOrSharedKey: Uint8Array): Promise<any> {
        await this._init()
        return Encryption.asymDecrypt(messageWithNonce, secretOrSharedKey)
    }

    public async buildSharedKeyStart(privateKey: Uint8Array): Promise<Uint8Array> {
        await this._init()
        return box.before(this.asymKeyPair!.publicKey, privateKey);
    }

    public async buildSharedKeyEnd(publicKey: Uint8Array): Promise<Uint8Array> {
        await this._init()
        return box.before(publicKey, this.asymKeyPair!.secretKey);
    }

    public getSeed() {
        return this.seed
    }

    public async getStorageContextKey(databaseName: string): Promise<any> {
        if (this.storageContextKeys[databaseName]) {
            return this.storageContextKeys[databaseName]
        }

        // Sign a consent message using the current db signing key
        const consent = `Authorized to own database: ${databaseName}`
        const signature = await this.sign(consent);

        // Create a deterministic symmetric key for this database
        this.storageContextKeys[databaseName] = await this.buildKey(signature, KeyringKeyType.SYM)

        return this.storageContextKeys[databaseName];
    }

}