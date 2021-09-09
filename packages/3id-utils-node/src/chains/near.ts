import { NearAuthProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { Manager } from '@3id/manager'
import CeramicClient from '@ceramicnetwork/http-client'
const nearAPI = require('near-api-js')
const nearSeedPhrase = require('near-seed-phrase')
const bs58 = require('bs58')
const crypto = require('crypto')

class NearProvider {

    public wallet: any

    constructor(mnemonic: string) {
        const { secretKey, publicKey } = nearSeedPhrase.parseSeedPhrase(mnemonic)
        this.wallet = {
            mnemonic,
            privateKey: secretKey,
            publicKey: publicKey,
            address: this.implicitAccountId(publicKey)
        }
    }

    public async sign(message: string) {
        const { KeyPair } = nearAPI
        const keyPair = KeyPair.fromString(this.wallet.privateKey)
        const messageBuffer = Buffer.from(message)
        const hash = crypto.createHash('sha256').update(messageBuffer).digest()
        const signature = keyPair.sign(hash)
        return signature
    }

    private implicitAccountId(publicKey: string) {
        return bs58.decode(publicKey.replace('ed25519:', '')).toString('hex');
    }

}

export default class NearUtils {

    static chainRef: string = "testnet"
    
    /**
     * Create a new 3ID account from a near ??.
     * Will automatically create if the 3ID doesn't exist.
     * 
     * @param privateKey Ethereum private key (hex) to create / get 3ID
     * @param address Ethereum address (hex)
     * 
     * @returns DID instance
     */
    static async createAccount(seedPhrase: string, ceramic: CeramicClient): Promise<CeramicClient | undefined>  {
        const manager = await NearUtils._getManager(seedPhrase, ceramic)
        const did = await manager.createAccount()
        return ceramic
    }

    // link an ethereum wallet to an existing 3ID
    /**
     * Link an existing Ethereum account to an existing 3ID
     * 
     * @param privateKey Ethereum private key (hex) to create / get 3ID
     * @param did3id The existing 3ID to link to this existing Ethereum account
     * 
     * @returns DID instance
     */
     static async linkAccount(seedPhrase: string, did3id: string, ceramic: CeramicClient): Promise<CeramicClient> {
        const manager = await NearUtils._getManager(seedPhrase, ceramic)
        await manager.addAuthAndLink(did3id)
        return ceramic
    }

    // @todo: Unlink an account

    static async _getManager(seed: string, ceramic: CeramicClient): Promise<Manager> {
        const provider = new NearProvider(seed)
        const authProvider = new NearAuthProvider(provider, provider.wallet.address, NearUtils.chainRef)
        
        const manager = new Manager(authProvider, { ceramic })
        return manager
    }

}