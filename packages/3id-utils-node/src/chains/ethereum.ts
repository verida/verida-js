import { ethers } from 'ethers'
import { EthereumAuthProvider } from '@3id/connect'
import { Manager } from '@3id/manager'
import CeramicClient from '@ceramicnetwork/http-client'

import EthereumProvider from './ethereum-provider'


export default class EthereumUtils {
    
    /**
     * Create a new 3ID account from an Ethereum private key.
     * Will automatically create if the 3ID doesn't exist.
     * 
     * @param privateKey Ethereum private key (hex) to create / get 3ID
     * @param address Ethereum address (hex)
     * 
     * @returns DID instance
     */
    static async createAccount(privateKey: string, ceramic: CeramicClient): Promise<CeramicClient | undefined>  {
        const manager = await EthereumUtils._getManager(privateKey, ceramic)
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
     static async linkAccount(privateKey: string, did3id: string, ceramic: CeramicClient): Promise<CeramicClient> {
        const manager = await EthereumUtils._getManager(privateKey, ceramic)
        await manager.addAuthAndLink(did3id)
        return ceramic
    }

    // @todo: Unlink an account

    static async _getManager(privateKey: string, ceramic: CeramicClient): Promise<Manager> {
        const wallet = new ethers.Wallet(privateKey)
        const address = wallet.address
        const ethProvider = new EthereumProvider(wallet)
        const authProvider = new EthereumAuthProvider(ethProvider, wallet.address)
        
        const manager = new Manager(authProvider, { ceramic })
        return manager
    }

}