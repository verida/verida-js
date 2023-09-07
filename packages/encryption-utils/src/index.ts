import { secretbox, box, randomBytes } from "tweetnacl";
import {
  decodeUTF8,
  encodeUTF8,
  encodeBase64,
  decodeBase64
} from "tweetnacl-util";
import { ethers, utils } from 'ethers'
import { isHexString } from "ethers/lib/utils";
const JSONSortify = require('json.sortify')

const newSymNonce = () => randomBytes(secretbox.nonceLength);
const newAsymNonce = () => randomBytes(box.nonceLength);
const newKey = (length: number) => randomBytes(length ? length : secretbox.keyLength);

/**
 * Utilizes `tweetnacl` for symmetric and asymmetric encryption.
 * 
 * Utilizes `keccak256` algorithm to hash signed data and `secp256k1` signature algorithm for the resulting signature.
 */
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
        if (typeof(data) === "undefined") {
            throw new Error("Data to encrypt is undefined")
        }

        data = decodeUTF8(JSONSortify(data));
        return EncryptionUtils.symEncryptBuffer(data, keyUint8Array);
    }

    static symDecrypt(messageWithNonce: any, keyUint8Array: Uint8Array) {
        let decrypted = EncryptionUtils.symDecryptBuffer(messageWithNonce, keyUint8Array);
        const base64DecryptedMessage = encodeUTF8(decrypted);
        return JSON.parse(base64DecryptedMessage);
    }

    static asymEncrypt(data: any, secretOrSharedKey: Uint8Array) {
        const nonce = newAsymNonce();
        const messageUint8 = decodeUTF8(JSONSortify(data));
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
        // Ensure deterministic order of data so signature matches regardless
        // of the attribute order
        if (data instanceof Uint8Array) { // this also covers `Buffer`
            data = utils.hexlify(data) // the hashing method that follows also tries to serialize strings, except when they are hex strings
        } else if (typeof data === 'object') {
            data = JSONSortify(data)
        }

        const messageHashBytes = EncryptionUtils.hashBytes(data)
        const signingKey = new utils.SigningKey(privateKeyBytes)
        const signature = signingKey.signDigest(messageHashBytes)
        return utils.joinSignature(signature)
    }

    /**
     * 
     * @param data 
     * @param signature 
     * @param publicKey Hex encoded public key or public key in shortened address format
     * @returns 
     */
    static verifySig(data: any, signature: string, publicKeyOrAddress: string) {
        const signerAddress = EncryptionUtils.getSigner(data, signature)
        if (signerAddress.toLowerCase() == publicKeyOrAddress.toLowerCase()) {
            return true
        }

        const expectedAddress = utils.computeAddress(publicKeyOrAddress)
        return signerAddress.toLowerCase() == expectedAddress.toLowerCase()
    }

    static getSigner(data: any, signature: string) {
        // Ensure deterministic order of data so signature matches regardless
        // of the attribute order
        if (data instanceof Uint8Array) { // this also covers `Buffer`
            data = utils.hexlify(data) // the hashing method that follows also tries to serialize strings, except when they are hex strings
        } else if (typeof data === 'object') {
            data = JSONSortify(data)
        }

        const messageHashBytes = EncryptionUtils.hashBytes(data)
        const signerAddress = utils.recoverAddress(messageHashBytes, signature)

        return signerAddress
    }

    static decodeBase64(data: any) {
        return decodeBase64(data)
    }

    static encodeBase64(data: any) {
        return encodeBase64(data)
    }

    static hash(data: any) {    
        if (typeof(data) === 'string') {
            if (!isHexString(data)) {
                data = utils.toUtf8Bytes(data)
            }
        } else {
            data = utils.toUtf8Bytes(JSONSortify(data))
        }

        return utils.keccak256(data)
    }

    static hashBytes(data: any) {
        const hash = EncryptionUtils.hash(data)
        return utils.arrayify(hash)
    }

    static base58ToHex(b58: string) {
        return ethers.utils.base58.decode(b58)
    }

    static hexToBase58(hex: string) {
        return ethers.utils.base58.encode(hex)
    }

    static hexToBytes(hex: string) {
        return ethers.utils.arrayify(hex)
    }

    static bytesToHex(bytes: Uint8Array) {
        return ethers.utils.hexlify(bytes)
    }

    static publicKeyToAddress(publicKeyHex: string) {
        const add = utils.computeAddress(publicKeyHex)
        return add
    }
}