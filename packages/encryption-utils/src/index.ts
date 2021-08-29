import { secretbox, sign, box, randomBytes } from "tweetnacl";
import {
  decodeUTF8,
  encodeUTF8,
  encodeBase64,
  decodeBase64
} from "tweetnacl-util";

const newSymNonce = () => randomBytes(secretbox.nonceLength);
const newAsymNonce = () => randomBytes(box.nonceLength);
const newKey = (length: number) => randomBytes(length ? length : secretbox.keyLength);

export default class EncryptionUtils {

    static symEncryptBuffer(data: any, keyUint8Array: Uint8Array) {
        const nonce = newSymNonce();
        const messageUint8 = data;
        const box = secretbox(messageUint8, nonce, keyUint8Array);

        const fullMessage = new Uint8Array(nonce.length + box.length);
        fullMessage.set(nonce);
        fullMessage.set(box, nonce.length);

        const base64FullMessage = encodeBase64(fullMessage);
        return base64FullMessage;
    }

    static symDecryptBuffer(messageWithNonce: any, keyUint8Array: Uint8Array) {
        const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
        const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength);
        const message = messageWithNonceAsUint8Array.slice(
            secretbox.nonceLength,
            messageWithNonce.length
        );

        const decrypted = secretbox.open(message, nonce, keyUint8Array);
        if (!decrypted) {
            throw new Error("Could not decrypt message");
        }

        return decrypted;
    }

    static symEncrypt(data: any, keyUint8Array: Uint8Array) {
        data = decodeUTF8(JSON.stringify(data));
        return EncryptionUtils.symEncryptBuffer(data, keyUint8Array);
    }

    static symDecrypt(messageWithNonce: any, keyUint8Array: Uint8Array) {
        let decrypted = EncryptionUtils.symDecryptBuffer(messageWithNonce, keyUint8Array);
        const base64DecryptedMessage = encodeUTF8(decrypted);
        return JSON.parse(base64DecryptedMessage);
    }

    static asymEncrypt(data: any, secretOrSharedKey: Uint8Array) {
        const nonce = newAsymNonce();
        const messageUint8 = decodeUTF8(JSON.stringify(data));
        const encrypted = box.after(messageUint8, nonce, secretOrSharedKey);

        const fullMessage = new Uint8Array(nonce.length + encrypted.length);
        fullMessage.set(nonce);
        fullMessage.set(encrypted, nonce.length);

        const base64FullMessage = encodeBase64(fullMessage);
        return base64FullMessage;
    }

    static asymDecrypt(messageWithNonce: any, secretOrSharedKey: Uint8Array) {
        const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
        const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength);
        const message = messageWithNonceAsUint8Array.slice(
            box.nonceLength,
            messageWithNonce.length
        );

        const decrypted = box.open.after(message, nonce, secretOrSharedKey);

        if (!decrypted) {
            throw new Error('Could not decrypt message');
        }

        const base64DecryptedMessage = encodeUTF8(decrypted);
        return JSON.parse(base64DecryptedMessage);
    }

    static sharedKey(publicKeyBytes: Uint8Array, privateKeyBytes: Uint8Array) {
        return box.before(publicKeyBytes, privateKeyBytes)
    }

    static randomKey(length: number) {
        return newKey(length);
    }

    static randomKeyPair() {
        return box.keyPair()
    }

    static signData(data: any, privateKeyBytes: Uint8Array) {
        let messageUint8 = decodeUTF8(JSON.stringify(data));
        return encodeBase64(sign.detached(messageUint8, privateKeyBytes));
    }

    static verifySig(data: any, sig: string, publicKeyBytes: Uint8Array) {
        let messageUint8 = decodeUTF8(JSON.stringify(data));
        return sign.detached.verify(messageUint8, decodeBase64(sig), publicKeyBytes);
    }

    static decodeBase64(data: any) {
        return decodeBase64(data)
    }

    static encodeBase64(data: any) {
        return encodeBase64(data)
    }
}