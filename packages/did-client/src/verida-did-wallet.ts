import { BlockchainAnchor } from "@verida/types"
import { utils, Wallet, Signer } from "ethers"
import { buildVeridaDidIdentifier } from "./utils"

/**
 * A wallet class that manages Verida DID identifiers and associated keys
 */
export class VeridaDidWallet {
    /** The DID string identifier */
    public did: string
    /** The blockchain network this DID is anchored to */
    public blockchainAnchor: BlockchainAnchor
    /** The wallet address */
    public address: string
    /** Signer instance used for signing messages */
    public signer: Signer
    /** Optional private key, unavailable if created from a signer */
    public privateKey: string | undefined

    /**
     * The constructor is intentionally private, use the static methods to create instances
     *
     * @param signer - Signer instance for signing messages
     * @param blockchainAnchor - Blockchain network to anchor the DID
     * @param address - Wallet address
     * @param privateKey - Optional private key
     */
    private constructor(signer: Signer, blockchainAnchor: BlockchainAnchor, address: string, privateKey: string | undefined) {
        this.did = buildVeridaDidIdentifier(blockchainAnchor, address)
        this.blockchainAnchor = blockchainAnchor
        this.address = address
        this.signer = signer
        this.privateKey = privateKey
    }

    /**
     * Create a new random wallet
     *
     * @param blockchainAnchor - Blockchain network to anchor the DID
     * @returns New VeridaDidWallet instance
     */
    public static createRandom(blockchainAnchor: BlockchainAnchor) {
        const wallet = Wallet.createRandom()
        return new VeridaDidWallet(wallet, blockchainAnchor, wallet.address, wallet.privateKey)
    }

    /**
     * Create a wallet from an existing signer
     *
     * @param signer - Signer instance to use
     * @param blockchainAnchor - Blockchain network to anchor the DID
     * @returns New VeridaDidWallet instance
     */
    public static async fromSigner(signer: Signer, blockchainAnchor: BlockchainAnchor) {
        const address = await signer.getAddress()
        return new VeridaDidWallet(signer, blockchainAnchor, address, undefined)
    }

    /**
     * Create a wallet from a private key or mnemonic phrase
     *
     * @param privateKeyOrMnemonic - Private key (0x prefixed) or mnemonic phrase
     * @param blockchainAnchor - Blockchain network to anchor the DID
     * @returns New VeridaDidWallet instance
     */
    public static fromPrivateKeyOrMnemonic(privateKeyOrMnemonic: string, blockchainAnchor: BlockchainAnchor) {
        let wallet
        if (privateKeyOrMnemonic.substr(0,2) == "0x") {
            wallet = new Wallet(privateKeyOrMnemonic)
        } else {
            wallet = Wallet.fromMnemonic(privateKeyOrMnemonic)
        }
        return new VeridaDidWallet(wallet, blockchainAnchor, wallet.address, wallet.privateKey)
    }

    /** The public key, same as the address */
    public get publicKey(): string {
        return this.address
    }

    /** The public key as a buffer */
    public get publicKeyBuffer(): Uint8Array {
        return Buffer.from(this.address.substr(2), 'hex')
    }

    /** The public key encoded in base58 */
    public get publicKeyBase58(): string {
        return utils.base58.encode(this.address)
    }

    /** The private key as a buffer if available */
    public get privateKeyBuffer(): Uint8Array | undefined {
        return this.privateKey ? Buffer.from(this.privateKey.substr(2), 'hex') : undefined
    }

    /** The private key encoded in base58 if available */
    public get privateKeyBase58(): string | undefined {
        return this.privateKey ? utils.base58.encode(this.privateKey) : undefined
    }
}
