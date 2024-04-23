import { utils, Wallet as EthersWallet } from "ethers"

export default class Wallet {

    /* @ts-ignore */
    private _did: string
    /* @ts-ignore */
    private _publicKey: string
    /* @ts-ignore */
    private _privateKey: string

    private _network: string

    public constructor(privateKey: string, network: string) {
        this._network = network
        this.load(privateKey)
    }

    public static createRandom(network: string = 'polpos') {
        const wallet = EthersWallet.createRandom()
        return new Wallet(wallet.privateKey, network)
    }

    private load(privateKey: string) {
        let wallet
        if (privateKey.substr(0,2) == "0x") {
            wallet = new EthersWallet(privateKey)
        } else {
            wallet = EthersWallet.fromMnemonic(privateKey)
        }

        this._did = `did:vda:${this._network}:${wallet.address}`
        this._privateKey = wallet.privateKey
        this._publicKey = wallet.publicKey
    }

    public get did(): string {
        return this._did
    }

    public get privateKey(): string {
        return this._privateKey
    }

    public get publicKey(): string {
        return this._publicKey
    }

    public get privateKeyBuffer(): Uint8Array {
        return Buffer.from(this._privateKey.substr(2), 'hex')
    }

    public get publicKeyBuffer(): Uint8Array {
        return Buffer.from(this._publicKey.substr(2), 'hex')
    }

    public get privateKeyBase58(): string {
        return utils.base58.encode(this._privateKey)
    }

    public get publicKeyBase58(): string {
        return utils.base58.encode(this._publicKey)
    }

}