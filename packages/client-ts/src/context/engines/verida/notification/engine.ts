import Axios, { AxiosInstance } from 'axios'
import { Keyring } from '@verida/keyring';
import { INotification } from '@verida/types';

export default class NotificationEngineVerida implements INotification {

    protected senderContextName: string
    protected senderKeyring: Keyring
    protected recipientContextName: string
    protected serverUrls: string[]
    protected did: string

    protected errors: string[] = []

    constructor(senderContextName: string, senderKeyring: Keyring, recipientContextName: string, did: string, serverUrls: string[]) {
        this.senderContextName = senderContextName
        this.senderKeyring = senderKeyring
        this.recipientContextName = recipientContextName
        this.did = did
        this.serverUrls = serverUrls
    }
    
    public async init(): Promise<void> {
        // Do nothing. No initialisation is required for this implementation.
        return
    }

    /**
    * Ping a notification server to fetch new messages
    */
    public async ping(): Promise<boolean> {
        const server = await this.getAxios();

        let success = true
        for (let s in this.serverUrls) {
            const serverUrl = this.serverUrls[s]

            try {
                // Returns the client context and the corresponding `DID`
                await server.post(serverUrl + 'ping', {
                    data: {
                        did: this.did,
                        context: this.recipientContextName
                    }
                })
            } catch (err: any) {
                this.errors.push(err.message)
                success = false
            }
        }

        return success
    }

    public getErrors(): string[] {
        return this.errors
    }

    protected async getAxios(): Promise<AxiosInstance> {
        const config: any = {
            headers: {
                "context-name": this.senderContextName,
            },
        }

        // Authenticate using the DID and a signed consent message
        const did = this.did!.toLowerCase()
        const message = `Access the notification service using context: "${this.senderContextName}"?\n\n${did}`
        const signature = await this.senderKeyring.sign(message)

        config["auth"] = {
            username: did.replace(/:/g, "_"),
            password: signature,
        }

        return Axios.create(config)
    }

}