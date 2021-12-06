import { createJWT, ES256KSigner } from 'did-jwt'
import { encodeBase64 } from 'tweetnacl-util'

// Note: See @verida/account/src/account.ts

export default class Credentials {

    public static echo(value: string): string {
        return value
    }

}