import { Manager } from '@3id/manager'
import CeramicClient from '@ceramicnetwork/http-client'
import ThreeIdProvider from '3id-did-provider'
import { Wallet } from 'ethers'

interface ThreeIdOptions {
    did?: string
}

export default class ThreeIdUtils {
    
    /**
     * Create a new 3ID account from a seeed phrase hex string.
     * 
     * If a DID is supplied, that DID is used to authenticate the existing DID
     * instead of creating a new one
     * 
     * @param seed 
     * @param ceramic
     * 
     * @returns DID instance
     */
    static async createAccount(seedPhrase: string, ceramic: CeramicClient, opts: ThreeIdOptions): Promise<CeramicClient | undefined>  {
        const wallet = Wallet.fromMnemonic(seedPhrase)

        const getPermission = async (request: any) => {
            return request.payload.paths
        }
        const seedBuffer = Buffer.from(wallet.privateKey.substr(2), 'hex')

        const authProvider = await ThreeIdProvider.create({
            getPermission,
            seed: seedBuffer,
            did: opts.did,
            ceramic
        })

        // A hack to inject the three ID provider into the Manager
        /* @ts-ignore */
        const manager = new Manager(undefined, { ceramic })
        /* @ts-ignore */
        manager.threeIdProviders[authProvider.id] = authProvider
        await manager.store.storeDID(authProvider.id, manager.threeIdProviders[authProvider.id].keychain._keyring.seed)
        return ceramic
    }

    /**
     * Link an existing 3ID account to an existing 3ID
     */
     static async linkAccount(privateKey: string, did3id: string, ceramic: CeramicClient): Promise<CeramicClient> {
        throw new Error("Not supported")
    }

}