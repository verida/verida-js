import Axios from 'axios'
import { DIDDocument, Interfaces } from "@verida/did-document"
import Wallet from "./wallet"

export default class DIDClient {

    private endpointUrl: string

    private privateKey?: Uint8Array
    private did?: string

    constructor(endpointUrl: string) {
        this.endpointUrl = endpointUrl
    }

    /**
     * Authenticate using a privateKey or seed phrase.
     * 
     * This allows the DIDClient to sign DIDDocuments before saving
     * 
     * @param privateKey {string} Hex representation of the private key or a mnemonic
     */
    public authenticate(privateKey: string) {
        const wallet = new Wallet(privateKey)
        this.privateKey = wallet.privateKeyBuffer
        this.did = wallet.did
    }

    public getDid(): string | undefined {
        return this.did
    }

    /**
     * Save a DID document
     * 
     * @param document 
     * @returns 
     */
    public async save(document: DIDDocument): Promise<boolean> {
        if (!this.privateKey) {
            throw new Error("Unable to save DIDDocument. No private key.")
        }

        document.signProof(this.privateKey)

        try {
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
        }
    }

    public async get(did: string): Promise<DIDDocument | undefined> {
        try {
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
        }
    }

}