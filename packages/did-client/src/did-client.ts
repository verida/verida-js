import Axios from 'axios'
import { DIDDocument, Interfaces } from "@verida/did-document"

export default class DIDClient {

    private endpointUrl

    constructor(endpointUrl: string) {
        this.endpointUrl = endpointUrl
    }

    public async save(document: DIDDocument): Promise<boolean> {
        if (!document.verifyProof()) {
            throw new Error('Document has invalid proof')
        }
        

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

    public async get(did: string): Promise<DIDDocument> {
        try {
            const response: any = await Axios.get(`${this.endpointUrl}/load?did=${did}`);
            const documentData: Interfaces.DIDDocumentStruct = response.data.data.document
            const doc = new DIDDocument(documentData)

            return doc
        } catch (err) {
            return
        }
    }

}