import { Resolver } from 'did-resolver'
import { getResolver } from '../resolver'
import { interpretIdentifier } from '../helpers'

jest.setTimeout(30000)

describe('ethrResolver (alt-chains)', () => {
  const addr = '0xd0dbe9d3698738f899ccd8ee27ff2347a7faa4dd'
  const { address } = interpretIdentifier(addr)
  const checksumAddr = address

  describe('eth-networks', () => {
    it('resolves on mainnet with versionId', async () => {
      const resolver = new Resolver(getResolver({ infuraProjectId: '6b734e0b04454df8a6ce234023c04f26' }))
      const result = await resolver.resolve('did:ethr:0x26bf14321004e770e7a8b080b7a526d8eed8b388?versionId=12090174')
      expect(result).toEqual({
        didDocumentMetadata: {
          nextVersionId: '12090175',
          nextUpdate: '2021-03-22T18:14:29Z',
        },
        didResolutionMetadata: {
          contentType: 'application/did+ld+json',
        },
        didDocument: {
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
          ],
          id: 'did:ethr:0x26bf14321004e770e7a8b080b7a526d8eed8b388',
          verificationMethod: [
            {
              id: 'did:ethr:0x26bf14321004e770e7a8b080b7a526d8eed8b388#controller',
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: 'did:ethr:0x26bf14321004e770e7a8b080b7a526d8eed8b388',
              blockchainAccountId: '0x26bF14321004e770E7A8b080b7a526d8eed8b388@eip155:1',
            },
          ],
          authentication: ['did:ethr:0x26bf14321004e770e7a8b080b7a526d8eed8b388#controller'],
          assertionMethod: ['did:ethr:0x26bf14321004e770e7a8b080b7a526d8eed8b388#controller'],
        },
      })
    })

    it('resolves on ropsten when configured', async () => {
      const did = 'did:ethr:ropsten:' + addr
      const ethr = getResolver({
        networks: [{ name: 'ropsten', rpcUrl: 'https://ropsten.infura.io/v3/6b734e0b04454df8a6ce234023c04f26' }],
      })
      const resolver = new Resolver(ethr)
      const result = await resolver.resolve(did)
      expect(result).toEqual({
        didDocumentMetadata: {},
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
          ],
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${checksumAddr}@eip155:3`,
            },
          ],
          authentication: [`${did}#controller`],
          assertionMethod: [`${did}#controller`],
        },
      })
    })

    it('resolves on rinkeby when configured', async () => {
      const did = 'did:ethr:rinkeby:' + addr
      const ethr = getResolver({
        networks: [{ name: 'rinkeby', rpcUrl: 'https://rinkeby.infura.io/v3/6b734e0b04454df8a6ce234023c04f26' }],
      })
      const resolver = new Resolver(ethr)
      const result = await resolver.resolve(did)
      expect(result).toEqual({
        didDocumentMetadata: {},
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
          ],
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${checksumAddr}@eip155:4`,
            },
          ],
          authentication: [`${did}#controller`],
          assertionMethod: [`${did}#controller`],
        },
      })
    })

    it('resolves on kovan when configured', async () => {
      const did = 'did:ethr:kovan:' + addr
      const ethr = getResolver({
        networks: [{ name: 'kovan', rpcUrl: 'https://kovan.infura.io/v3/6b734e0b04454df8a6ce234023c04f26' }],
      })
      const resolver = new Resolver(ethr)
      const result = await resolver.resolve(did)
      expect(result).toEqual({
        didDocumentMetadata: {},
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
          ],
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${checksumAddr}@eip155:42`,
            },
          ],
          authentication: [`${did}#controller`],
          assertionMethod: [`${did}#controller`],
        },
      })
    })

    it('resolves on rsk when configured', async () => {
      const did = 'did:ethr:rsk:' + addr
      const ethr = getResolver({ networks: [{ name: 'rsk', rpcUrl: 'https://did.rsk.co:4444' }] })
      const resolver = new Resolver(ethr)
      const result = await resolver.resolve(did)
      expect(result).toEqual({
        didDocumentMetadata: {},
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
          ],
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${checksumAddr}@eip155:30`,
            },
          ],
          authentication: [`${did}#controller`],
          assertionMethod: [`${did}#controller`],
        },
      })
    })

    it('resolves on rsk:testnet when configured', async () => {
      const did = 'did:ethr:rsk:testnet:' + addr
      const ethr = getResolver({ networks: [{ name: 'rsk:testnet', rpcUrl: 'https://did.testnet.rsk.co:4444' }] })
      const resolver = new Resolver(ethr)
      const result = await resolver.resolve(did)
      expect(result).toEqual({
        didDocumentMetadata: {},
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
          ],
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${checksumAddr}@eip155:31`,
            },
          ],
          authentication: [`${did}#controller`],
          assertionMethod: [`${did}#controller`],
        },
      })
    })

    it('resolves public key identifier on rsk when configured', async () => {
      const did = 'did:ethr:rsk:0x03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479'
      const ethr = getResolver({ networks: [{ name: 'rsk', rpcUrl: 'https://did.rsk.co:4444' }] })
      const resolver = new Resolver(ethr)
      const doc = await resolver.resolve(did)
      return expect(doc).toEqual({
        didDocumentMetadata: {},
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
          ],
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: '0xF3beAC30C498D9E26865F34fCAa57dBB935b0D74@eip155:30',
            },
            {
              id: `${did}#controllerKey`,
              type: 'EcdsaSecp256k1VerificationKey2019',
              controller: did,
              publicKeyHex: '03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479',
            },
          ],
          authentication: [`${did}#controller`, `${did}#controllerKey`],
          assertionMethod: [`${did}#controller`, `${did}#controllerKey`],
        },
      })
    })

    it('resolves public keys and services on aurora when configured', async () => {
      const did = 'did:ethr:aurora:0x036d148205e34a8591dcdcea34fb7fed760f5f1eca66d254830833f755ff359ef0'
      const ethr = getResolver({
        networks: [
          {
            name: 'aurora',
            chainId: 1313161554,
            rpcUrl: 'https://mainnet.aurora.dev',
            registry: '0x63eD58B671EeD12Bc1652845ba5b2CDfBff198e0',
          },
        ],
      })
      const resolver = new Resolver(ethr)
      const doc = await resolver.resolve(did)
      return expect(doc).toEqual({
        didDocumentMetadata: {
          updated: '2022-01-19T12:19:59Z',
          versionId: '57702193',
        },
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
          ],
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: '0x7a988202a04f00436f73972DF4dEfD80c3A6BD13@eip155:1313161554',
            },
            {
              id: `${did}#controllerKey`,
              type: 'EcdsaSecp256k1VerificationKey2019',
              controller: did,
              publicKeyHex: '036d148205e34a8591dcdcea34fb7fed760f5f1eca66d254830833f755ff359ef0',
            },
            {
              controller: did,
              id: `${did}#delegate-1`,
              publicKeyHex: 'c4c323b4ba114591579d92591b26e92e59aa5529c6adbebb820da7ca407e9d34',
              type: 'Ed25519VerificationKey2018',
            },
            {
              controller: did,
              id: `${did}#delegate-2`,
              publicKeyHex:
                '04ebafc30f377af345bb86c9269ed6432d6245b44f01dd410f8c0e73ab1801211c84b76fade77b4d6e27da82d051e3603b35c21072201e1a1c00073ab09d004ee4',
              type: 'EcdsaSecp256k1VerificationKey2019',
            },
          ],
          authentication: [`${did}#controller`, `${did}#controllerKey`],
          assertionMethod: [`${did}#controller`, `${did}#controllerKey`, `${did}#delegate-1`, `${did}#delegate-2`],
          service: [
            {
              id: `${did}#service-1`,
              serviceEndpoint: 'https://example.com/inbox',
              type: 'DIDCommMessaging',
            },
            {
              id: `${did}#service-2`,
              serviceEndpoint: 'https://example.com/inbox2',
              type: 'DIDCommMessaging',
            },
          ],
        },
      })
    })
  })
})
