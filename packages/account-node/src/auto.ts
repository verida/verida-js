import { AccountConfig, AccountNodeConfig } from '@verida/types'
import { VeridaDidWallet } from '@verida/did-client'
import { DefaultNetworkBlockchainAnchors } from '@verida/vda-common'
import { WalletAccount, WalletAccountConfig } from './wallet-account'

/**
 * An Authenticator that automatically signs everything
 */
export default class AutoAccount extends WalletAccount {
    constructor(autoConfig: AccountNodeConfig, accountConfig?: AccountConfig) {
        const { privateKey, ...config } = autoConfig

        const blockchain = DefaultNetworkBlockchainAnchors[config.network]
        const veridaDidWallet = VeridaDidWallet.fromPrivateKeyOrMnemonic(privateKey, blockchain)

        const walletAccountConfig: WalletAccountConfig = {
            ...config,
            veridaDidWallet
        }

        super(walletAccountConfig, accountConfig)
    }
}
