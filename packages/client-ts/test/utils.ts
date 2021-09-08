import { Client } from '../src'

export const assertIsValidDbResponse = function(assert: any, data: any) {
    assert.ok(data, 'Data returned')
    assert.ok(data.length && data.length > 0, 'Array returned with at least one row')
    // @todo: add seom helpful utilities to ensure resopnse is what is expected
    // assert.ok(data[0].hello == 'world', 'First result has expected value')
}


export const assertIsValidSignature = async function(assert: any, client: Client, did: string, data: any) {
    const validSignatures = await client.getValidDataSignatures(data, did)
    assert.ok(validSignatures.includes(did), 'DID is included in list of valid signatures')
}