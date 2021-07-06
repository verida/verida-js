import { EventEmitter } from 'events'
import { Wallet } from 'ethers'
import { fromString, toString } from 'uint8arrays'

export default class EthereumProvider extends EventEmitter {
    wallet: Wallet

    constructor(wallet: Wallet) {
        super()
        this.wallet = wallet
    }

    async send(
        request: { method: string; params: Array<any> },
        callback: (err: Error | null | undefined, res?: any) => void
    ): void {
        if (request.method === 'eth_chainId') {
            callback(null, { result: '1' })
        } else if (request.method === 'personal_sign') {
            let message = request.params[0] as string
            if (message.startsWith('0x')) {
                message = toString(fromString(message.slice(2), 'base16'), 'utf8')
            }
            const signature = await this.wallet.signMessage(message)
            callback(null, { result: signature })
        } else {
            callback(new Error(`Unsupported method: ${request.method}`))
        }
    }
}