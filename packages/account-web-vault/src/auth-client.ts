import { AuthClientConfig, AuthResponse } from "./interfaces"
import EncryptionUtils from "@verida/encryption-utils"
import QrCode from 'qrcode-with-logos'
const _ = require("lodash")
const store = require('store')

const VERIDA_USER_SIGNATURE = '_verida_auth_user_signature'

export default class AuthClientOld {

    ws: any
    config: any
    symKeyBytes: Uint8Array
    modal: any

    constructor(config: any, modal: any) {
        this.config = _.merge({
            schemeUri: 'veridavault://login-request',
            loginUri: 'https://vault.verida.io/request',
            deeplinkId: 'verida-auth-client-deeplink',
            request: {}
        }, config)
        this.modal = modal

        const decryptedSignature = store.get(VERIDA_USER_SIGNATURE);
        if (decryptedSignature) {
            this.config.callback(decryptedSignature)
        }
        const symKeyBytes = this.symKeyBytes = EncryptionUtils.randomKey(32)

        this.ws = new WebSocket(config.serverUri)
        const client = this

        this.ws.onmessage = function (event: MessageEvent) {
            client.newMessage(event)
        }

        config = this.config
        this.ws.onopen = function () {
            const encryptedRequest = EncryptionUtils.symEncrypt(JSON.stringify(config.request), symKeyBytes)
            const payload = {
                request: encryptedRequest
            }

            client.ws.send(JSON.stringify({ type: 'generateJwt', appName: config.appName, payload }))
        }

        this.ws.onerror = this.error
    }

    newMessage(event: MessageEvent) {
        const response = <AuthResponse>JSON.parse(event.data)

        switch (response.type) {
            case 'auth-client-request':
                const queryParams = this.generateQueryParams(response.message!)
                const redirectUri = `${this.config.loginUri}${queryParams}`
                const schemeUri = `${this.config.schemeUri}${queryParams}`
                let qrcode = new QrCode({
                    canvas: document.getElementById(this.config.canvasId!) as any,
                    content: redirectUri,
                    width: 380,
                    image: document.getElementById("image") as any,
                    logo: {
                        src: "https://assets.verida.io/verida_logo_512x512.png"
                    }
                });

                try {
                    const isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
                    if (isMobile) {
                        // On a mobile device, so attempting to auto-redirect to application
                        window.location.href = schemeUri
                    }
                } catch (err) {
                    console.log(err)
                }

                const deeplinkElm = document.getElementById(this.config.deeplinkId!)

                if (deeplinkElm) {
                    deeplinkElm.setAttribute('href', schemeUri)
                }
                qrcode.toCanvas().then(() => {}).catch((error: any) => {
                    console.error("Error: ", { error })
                });
                return
            case 'auth-client-response':
                const key = this.symKeyBytes!
                const checkedValue: HTMLElement | any = document.getElementById('verida-checked');


                const decrypted = EncryptionUtils.symDecrypt(response.message, key)
                if (checkedValue.checked) {
                    store.set(VERIDA_USER_SIGNATURE, decrypted)
                }

                this.modal.style.display = 'none'
                this.config.callback(decrypted)
                return
        }

        console.error(`Unknown message type: ${response.type}`, response)
    }

    error(event: MessageEvent) {
        console.error("WebSocket error: ", event)
    }

    generateQueryParams(didJwt: string) {
        const symKeyHex = "0x" + Buffer.from(this.symKeyBytes).toString("hex")

        // note: can't use `key` as a parameter as its a reserved word in react native
        // instead use `_k` (key) and `_r` (request)
        return `?_k=${symKeyHex}&_r=${didJwt}`
    }

}