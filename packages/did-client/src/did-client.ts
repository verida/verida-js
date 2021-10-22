import { DIDDocument } from "./interfaces"
import Axios from 'axios'
import VdaDidDocument from "./did-document"

export default class DIDClient {

    private endpointUrl

    constructor(endpointUrl: string) {
        this.endpointUrl = endpointUrl
    }

    public async save(document: DIDDocument) {
        // @todo: verify proof before sending

        try {
            await Axios.post(`${this.endpointUrl}/commit`, {
                params: {
                    document
                }
            })

            return true
        } catch (err: any) {
            console.log(err)
            if (err.response && typeof err.response.data && err.response.data.status == 'fail') {
                throw new Error(err.response.data.message)
            }

            throw err
        }
    }

    public async get(did: string) {
        try {
            const response: any = await Axios.get(`${this.endpointUrl}/load?did=${did}`);
            const documentData: DIDDocument = response.data.data.document
            const doc = new VdaDidDocument(documentData)

            return doc
        } catch (err) {
            return null
        }
    }

}