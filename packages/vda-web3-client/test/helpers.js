import { hexlify, isBytes } from '@ethersproject/bytes'
import { toUtf8Bytes } from '@ethersproject/strings'

export function decodeAttrValue(value, encoding) {
    const matchHexString = value.match(/^0x[0-9a-fA-F]*$/)
    if (encoding && !matchHexString) {
        if (encoding === 'base64') {
        return hexlify(base64.decode(value))
        }
        if (encoding === 'base58') {
        return hexlify(Base58.decode(value))
        }
    } else if (matchHexString) {
        return value
    }

    return hexlify(toUtf8Bytes(value))
}

export function attributeToHex(key, value) {
    if (value instanceof Uint8Array || isBytes(value)) {
        return hexlify(value)
    }
    const matchKeyWithEncoding = key.match(/^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/)
    const encoding = matchKeyWithEncoding?.[6]

    // const matchValueWithContext =
    //   matchKeyWithEncoding?.[1] === 'svc'
    //     ? (<string>value).match(/(.*)\?context=(.*)&type=(\w+)/)
    //     : (<string>value).match(/(.*)\?context=(.*)/)
    const matchValueWithContext = value.match(/(.*)(\?context=(.*))/)

    // console.log('attributeToHex value : ', value)
    // console.log('attributeToHex matched : ', matchValueWithContext)

    const attrVal = matchValueWithContext ? matchValueWithContext?.[1] : value
    const attrContext = matchValueWithContext?.[2]

    let returnValue = decodeAttrValue(attrVal, encoding)

    if (attrContext) {
        const contextTag = Buffer.from(attrContext, 'utf-8').toString('hex')
        returnValue = `${returnValue}${contextTag}`
    }
    return returnValue
}