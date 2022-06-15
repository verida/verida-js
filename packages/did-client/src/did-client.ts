import Axios from 'axios'
import { DIDDocument, Interfaces } from "@verida/did-document"
import Wallet from "./wallet"

// @todo: Link this in package.json
import { VeridaContractInstance } from '@verida/web3'

const CONTRACT_ADDRESSES: any = {
    'testnet': '0x2862BC860f55D389bFBd1A37477651bc1642A20B'
}

const didRegistryABI = require('./VDADIDRegistry.abi.json')

export interface DIDClientConfig {
    environment: string
    connectionType: 'gasless' | 'web3',
    headers?: object
}

export class DIDClient {

    private config: DIDClientConfig

    private didRegistry?: VeridaContractInstance
    private privateKey?: Uint8Array
    private did?: string
    private wallet?: Wallet

    constructor(config: DIDClientConfig) {
        this.config = config
    }

    /**
     * Authenticate using a privateKey or seed phrase.
     * 
     * This allows the DIDClient to sign DIDDocuments before saving
     * 
     * @param privateKey {string} Hex representation of the private key or a mnemonic
     */
    public authenticate(privateKey: string) {
        this.wallet = new Wallet(privateKey)
        this.privateKey = this.wallet.privateKeyBuffer
        this.did = this.wallet.did

        switch (this.config.connectionType) {
            case 'gasless':
                this.didRegistry = VeridaContractInstance(
                    this.config.connectionType,
                    {
                        veridaKey: privateKey, // is this correct? might need to be this.privateKey converted to string?
                        abi: didRegistryABI,
                        address: CONTRACT_ADDRESSES[this.config.environment]
                        // @todo: Assuming `headers` added to Web3Config
                        //headers: this.config.headers ? this.config.headers : {}
                    }
                )
                break
            case 'web3':
                // @todo: configure as appropriate
                break
            default:
                throw new Error("Unknown blockchain connection type specified")
        }
    }

    public getDid(): string | undefined {
        return this.did
    }

    public getPublicKey(): string {
        return this.wallet!.publicKey
    }

    /**
     * Save a DID document
     * 
     * @param document 
     * @returns 
     */
    public async save(document: DIDDocument): Promise<boolean> {
        if (!this.didRegistry) {
            throw new Error("Unable to save DIDDocument. No account connected.")
        }

        document.signProof(this.privateKey!)

        // @todo: use this.didRegistry to update the DID document

        /*try {
            const response = await Axios.post(`${this.endpointUrl}/commit`, {
                params: {
                    document: document.export()
                }
            })

            return true
        } catch (err: any) {
            if (err.response && typeof err.response.data && err.response.data.status == 'fail') {
                throw new Error(err.response.data.message)
            }

            throw err
        }*/
    }

    public async get(did: string): Promise<DIDDocument | undefined> {
        /*try {
            const response: any = await Axios.get(`${this.endpointUrl}/load?did=${did}`);
            const documentData: Interfaces.DIDDocumentStruct = response.data.data.document
            const doc = new DIDDocument(documentData)

            return doc
        } catch (err: any) {
            if (err.response && typeof err.response.data && err.response.data.status == 'fail') {
                if (err.response.data.message == `Invalid DID or not found`) {
                    // Return undefined if not found
                    return
                }

                throw new Error(err.response.data.message)
            }

            throw err
        }*/

        // @todo: use this.didRegistry to get the DID document
    }

}