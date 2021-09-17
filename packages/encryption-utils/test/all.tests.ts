'use strict'
const assert = require('assert')
import { box } from "tweetnacl"

import EncryptionUtils from "../src/index"

/**
 * 
 */
describe('Encryption tests', () => {

    describe('Sending messages', function() {
        this.timeout(200000)
        
        it('can send a message between users of the same application', async function() {
            const keyring1 = {
                publicKey: new Uint8Array([
                    174, 46, 180,  28, 236,  89, 211,  62,
                    173,  2, 249,  95,  77, 119, 164, 207,
                    103, 68,  91,  68, 111, 224, 180,  61,
                    19,  2, 220, 135, 249,  54,  94,  43
                ]),
                privateKey: new Uint8Array([
                    76, 172,  49, 249,  10,  24, 125, 157,
                    249, 115,  72, 250, 231,  95, 247, 250,
                    145, 133,  14, 254,  32, 178,  73, 174,
                    170, 231, 185, 206, 174,  71, 128,  29
                ])
            }

            const sharedInputKey = box.before(keyring1.publicKey, keyring1.privateKey)
            const data = "some random string"
            let encrypted = EncryptionUtils.asymEncrypt(data, sharedInputKey)
            encrypted = 'GRz4pwYHneypgX8bge1r2nABDpGI/a2nkrWHm/WEhBNPwqQB/dfJqO12RyDCdaQjVEtoXrEjhdZHRzwUDeYAL+34DdOrOOG0XLyYyQomtS2gFs8tA+frWolkFgMdD4zD3N7G2c/F9Mx9F+SsYlPFgtQrJS8qJKA5TmNTko8FAjX/LxHxoPXYo9SDGojUK6iG7PlG0Yynn8tqXJhSB/ZsTWgt1O6IAerLj03KryAB7F3KsRA1tAL8V+BNaEMLglSdfhz4mWm/35ntZ/ut6/uX/nDUnD3YknLyEoviQJgwdLcdP6BZvBhrz3RFy4BwpWqMr9tm4IxhtVWp1pb1D9S/ItXd4SjyGcoUQd3QXzONbjdfHntjjMCsiVN88nwl3m6gxvOWr4nZTMiNI3lyEIiewnyR9d1WrEzs/ZIeGwPAnqKJWib9Bp8qGohPqYiJdM4X1J6BtKldhsX2BDlrEGW5zOO+bBBg4u4ff2AIsl7Z67a9sFRqQgT813GrXU/tjGEw/hWTYWNXg5hAiLQnS3+J469WhXHFpt3UQYyVgZjC+hfEiAyh2CdrlRZoc2afpB1Z6EsqkFL9ls6YCLx5IOWbm9xXLWEQQlyC9aOKbFZ+IdIUyNNbRBEURsl0tozrgEa1OrM2NaVjaZHRdV0fRh3D5ocedSrPcr2xqM4wMGEgtrTHrShhtrFIlmY1Z/z1TQ3gTafhAiCOzwa/ZGnFM1ZzFnqrJOgIbRCDAVEeafCtTmE5rvYLhrQ+bU+V17fqLMybKuADkfl2Ne2i0XqNJDJtBYyyI9ZBoBORxQ/v+iO5tr0VJj5QA07bwo1pnpUplU9eyWyQS5UdIaMjxibqPZvFIp0HLhAMk2TveMBqgsspBZWNeUrAV0jJUBQukV0ehJPij2dk0SC/l0vVU/XV6njQJac91RZayZ82ah1/l99QggtB+YDXDy6uizUSKcYABDcqU5bWZu58nY9j0RZdoVqSmEL/X41XGJRuLM4kPgQuvAxDz7lMnrDrBU/JYR3DnkRuhJS39yE80+I9b6HW/ykSnFZrcUUiqn1Bf4BoXIZdzcp648Dc1TU6oDDa1odAI2HxHuuOyeCsIbJvecPKiPuxjAQOTmQlcN0ayV0z3Q93tv1u5gF18LGtY/90mbbhypMK06eeBGFU82JcguuL0gHRb3ceQRXfV+dsAJR4eaG673f60fhiLoxpjAilpHcDgEou4xd5RzI399GfzAjpd8oV6TzyoXGfiGwdIZGR2pGakyCkagMF7GwcPjSvWV0DJpZGR0t2xYVeepCKNyWVRQpgx72FzHHAiAQVxf77NOKPMupolIuMtQ3Vj7tiM2QWBZnHVSCFnp4z9zbbV0Gc9p3dnxxECihW+uYiK3s8NEQDjXwe8/5GYUFZCglGMOzuRGksez2GBzg215M0BQSWLZHBv7frWJjSF3UmpGEmLDFnckdgPoIylMLzgiK603JHV8pniotn1LINT1XoV5OLhAkn3/z1glEucbeSyrxah9z20Tp8LzE2OWXgHb5Oh68FKM8zaTO0sYvtCCpmtEHcBxUS'

            const sharedOutputKey = box.before(keyring1.publicKey, keyring1.privateKey)
            const decrypted = EncryptionUtils.asymDecrypt(encrypted, sharedOutputKey)

            assert.equal(data, decrypted, "Input and output match")
        })
    })

})