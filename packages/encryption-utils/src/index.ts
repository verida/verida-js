import { secretbox, box, randomBytes } from "tweetnacl";
import {
  decodeUTF8,
  encodeUTF8,
  encodeBase64,
  decodeBase64
} from "tweetnacl-util";
import { ethers, utils } from 'ethers'
import util = require("tweetnacl-util");
import { isHexString } from "ethers/lib/utils";

const newSymNonce = () => randomBytes(secretbox.nonceLength);
const newAsymNonce = () => randomBytes(box.nonceLength);
const newKey = (length: number) => randomBytes(length ? length : secretbox.keyLength);

function isArrayLike(item : any) {
    return (
        Array.isArray(item) || 
        (!!item &&
          typeof item === "object" &&
          typeof (item.length) === "number" && 
          (item.length === 0 ||
             (item.length > 0 && 
             (item.length - 1) in item)
          )
        )
    );
}

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
        const messageHashBytes = EncryptionUtils.hashBytes(data)
        const signingKey = new utils.SigningKey(privateKeyBytes)
        const signature = signingKey.signDigest(messageHashBytes)
        return utils.joinSignature(signature)
    }

    /**
     * 
     * @param data 
     * @param signature 
     * @param publicKey Hex encoded public key
     * @returns 
     */
    static verifySig(data: any, signature: string, publicKey: string) {
        const expectedAddress = utils.computeAddress(publicKey)
        const messageHashBytes = EncryptionUtils.hashBytes(data)
        const signerAddress = utils.recoverAddress(messageHashBytes, signature)

        return signerAddress.toLowerCase() == expectedAddress.toLowerCase()
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
            data = utils.toUtf8Bytes(JSON.stringify(data))
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