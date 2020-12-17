import { Connection, ConnectionConfig } from '@verida/storage'
import { DIDDocument } from 'did-document'
import { ethers } from 'ethers'
import Axios from 'axios'

export default class StorageConnectionEthr extends Connection {

    /**
     * Name of this DID method (ie: `ethr`)
     */
    public didMethod: string = 'ethr'

    private wallet: ethers.Wallet
    private address: string
    private endpointUri: string

    constructor(config: ConnectionConfig, endpointUri='http://localhost:5001/') {
        super()
        if (!config.privateKey) {
            throw new Error('Private key must be specified')
        }

        this.wallet = new ethers.Wallet(config.privateKey)
        this.address = this.getAddress()
        this.endpointUri = endpointUri
    }

    public async getDoc(did: string): Promise<any> {
        try {
            let response = await Axios.get(this.endpointUri + 'load?did=' + did);
            let document = response.data.data.document;
            let doc = new DIDDocument(document, document['@context']);

            return doc;
        } catch (err) {
            return null;
        }
    }

    public async saveDoc(did: string, didDocument: any): Promise<any> {
        didDocument = await this.createProof(didDocument)

        try {
            await Axios.post(this.endpointUri + 'commit', {
                params: {
                    document: didDocument,
                    did: did
                }
            });

            return true
        } catch (err) {
            console.log(err)
            if (err.response && typeof err.response.data && err.response.data.status == 'fail') {
                throw new Error(err.response.data.message)
            }

            throw err
        }
    }

    public async createProof(doc: any) {
        let data = doc.toJSON();
        delete data['proof']

        //let messageUint8 = decodeUTF8(JSON.stringify(data))
        //let signature = encodeBase64(sign.detached(messageUint8, this.wallet.))

        // Sign the document using the Etherem key
        const signature = await this.sign(JSON.stringify(data))

        data['proof'] = {
            alg: 'Ed25519',
            signature: signature
        };

        return new DIDDocument(data)
    }

    /**
     * Sign data as the currently authenticated DID
     * 
     * @param data 
     */
    public async sign(message: string): Promise<string> {
        return await this.wallet.signMessage(message)
    }

    /**
     * Verify message was signed by a particular DID
     * 
     * @param did 
     * @param message 
     * @param signature 
     * @todo
     */
    public async verify(expectedDid: string, message: string, signature: string): Promise<boolean> {
        const did = await this.recoverDid(message, signature)
        if (!did) {
            return false
        }

        return expectedDid == did
    }

    public async recoverDid(message: string, signature: string) {
        const address = ethers.utils.verifyMessage(message, signature)
        if (address) {
            return `did:${this.didMethod}:${address}`
        }
    }

    public getPublicKey(privateKey: string): string {
        return this.wallet.publicKey
    }

    public getAddress(): string {
        return ethers.utils.computeAddress(this.wallet.privateKey)
    }

    public getDid(): string {
        return `did:${this.didMethod}:${this.address}`
    }

}