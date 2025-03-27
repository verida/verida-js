import { AccountConfig, AccountNodeConfig, SignerAccountConfig } from '@verida/types'
import { SignerAccount } from './signer-account'
import { Wallet } from 'ethers'
import { VeridaDidWallet } from '@verida/did-client'
import { DefaultNetworkBlockchainAnchors } from '@verida/vda-common'

/**
 * An Authenticator that automatically signs everything
 */
export default class AutoAccount extends SignerAccount {
    constructor(autoConfig: AccountNodeConfig, accountConfig?: AccountConfig) {
        const { privateKey, ...config } = autoConfig

        const wallet = new Wallet(privateKey)

        const blockchain = DefaultNetworkBlockchainAnchors[config.network]
        const veridaDidWallet = VeridaDidWallet.fromPrivateKeyOrMnemonic(privateKey, blockchain)

        const signerConfig: SignerAccountConfig = {
            ...config,
            signer: wallet
        }

        super(signerConfig, veridaDidWallet, accountConfig)
    }
}
