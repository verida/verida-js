import { NearAuthProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { Manager } from '@3id/manager'
import CeramicClient from '@ceramicnetwork/http-client'
const nearSeedPhrase = require('near-seed-phrase')
const bs58 = require('bs58')
const crypto = require('crypto')
import { KeyPair } from 'near-api-js'
import * as uint8arrays from 'uint8arrays'

const nearAPI = require('near-api-js')

class NearProvider {

    public wallet: any
    private provider: KeyPair

    constructor(mnemonic: string) {
        const { secretKey, publicKey } = nearSeedPhrase.parseSeedPhrase(mnemonic)
        this.wallet = {
            mnemonic,
            privateKey: secretKey,
            publicKey: publicKey,
            address: publicKey
        }

        this.provider = KeyPair.fromString(secretKey)
    }

    public async sign(message: string): Promise<{ signature: String, account: String }> {
        const { signature, publicKey } = await this.provider.sign(
            uint8arrays.fromString(message)
        );
        return {
            signature: uint8arrays.toString(signature, 'base64pad'),
            account: uint8arrays.toString(publicKey.data, 'base64pad'),
        };
    }

}

export default class NearUtils {

    static chainRef: string = "near-testnet"
    
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