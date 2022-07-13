import { Resolver } from 'did-resolver'
import { getResolver } from '../resolver'

describe('error handling', () => {
  const didResolver = new Resolver(
    getResolver({
      networks: [{ name: 'example', rpcUrl: 'example.com' }],
    })
  )

  it('rejects invalid DID', async () => {
    expect.assertions(1)
    await expect(didResolver.resolve('did:ethr:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX')).resolves.toEqual({
      didDocument: null,
      didDocumentMetadata: {},
      didResolutionMetadata: {
        error: 'invalidDid',
        message: 'Not a valid did:ethr: 2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX',
      },
    })
  })

  it('rejects resolution on unconfigured network', async () => {
    expect.assertions(1)
    await expect(
      didResolver.resolve('did:ethr:zrx:0x03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479')
    ).resolves.toEqual({
      didDocument: null,
      didDocumentMetadata: {},
      didResolutionMetadata: {
        error: 'unknownNetwork',
        message: 'The DID resolver does not have a configuration for network: zrx',
      },
    })
  })
})
