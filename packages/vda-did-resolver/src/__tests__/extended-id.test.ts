import { identifierMatcher, interpretIdentifier } from '../helpers'

describe('pattern matcher', () => {
  const matcher = identifierMatcher

  describe('matches', () => {
    it('blockchainAccountId:', () => {
      expect(matcher.test('0xd0dbe9d3698738f899ccd8ee27ff2347a7faa4dd')).toBe(true)
    })

    it('blockchainAccountId: ignoring case', () => {
      expect(matcher.test('0x' + 'd0dbe9d3698738f899ccd8ee27ff2347a7faa4dd'.toUpperCase())).toBe(true)
    })

    it('publicKeyHex compressed', () => {
      expect(matcher.test('0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71')).toBe(true)
    })

    it('publicKeyHex compressed ignore case', () => {
      expect(
        matcher.test('0x' + '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'.toUpperCase())
      ).toBe(true)
    })
  })

  describe('rejects', () => {
    it('hex strings of smaller size', () => {
      expect(matcher.test('0xd0dbe9d3698738f899ccd8ee27ff23')).toBe(false)
    })

    it('hex strings of ambiguous size', () => {
      expect(matcher.test('0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f14')).toBe(false)
    })

    it('hex strings of larger size', () => {
      expect(matcher.test('0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71dbe9d369')).toBe(false)
    })
  })
})

describe('interpretIdentifier', () => {
  const pubKey = '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
  const checksumAddress = '0xC662e6c5F91B9FcD22D7FcafC80Cf8b640aed247'

  it('parses ethereumAddress', () => {
    const { address, publicKey, network } = interpretIdentifier(checksumAddress.toLowerCase())
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toBeUndefined()
    expect(network).toBeUndefined()
  })
  it('parses ethereumAddress with checksum', () => {
    const { address, publicKey, network } = interpretIdentifier(checksumAddress)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toBeUndefined()
    expect(network).toBeUndefined()
  })
  it('parses did:vda with address', () => {
    const { address, publicKey, network } = interpretIdentifier(`did:vda:${checksumAddress}`)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toBeUndefined()
    expect(network).toBeUndefined()
  })
  it('parses did:vda with address and version', () => {
    const { address, publicKey, network } = interpretIdentifier(`did:vda:${checksumAddress}?versionId=42`)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toBeUndefined()
    expect(network).toBeUndefined()
  })
  it('parses did:vda with address and network', () => {
    const { address, publicKey, network } = interpretIdentifier(`did:vda:0x1:${checksumAddress}`)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toBeUndefined()
    expect(network).toEqual('0x1')
  })
  it('parses did:vda with address and sub-network', () => {
    const { address, publicKey, network } = interpretIdentifier(`did:vda:rsk:testnet:${checksumAddress}`)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toBeUndefined()
    expect(network).toEqual('rsk:testnet')
  })
  it('parses did:vda with address and sub-network and version', () => {
    const { address, publicKey, network } = interpretIdentifier(`did:vda:rsk:testnet:${checksumAddress}?versionId=42`)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toBeUndefined()
    expect(network).toEqual('rsk:testnet')
  })

  it('parses publicKey', () => {
    const { address, publicKey, network } = interpretIdentifier(pubKey)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toEqual(pubKey)
    expect(network).toBeUndefined()
  })
  it('parses did:vda with publicKey', () => {
    const { address, publicKey, network } = interpretIdentifier(`did:vda:${pubKey}`)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toEqual(pubKey)
    expect(network).toBeUndefined()
  })
  it('parses did:vda with publicKey and version', () => {
    const { address, publicKey, network } = interpretIdentifier(`did:vda:${pubKey}?versionId=42`)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toEqual(pubKey)
    expect(network).toBeUndefined()
  })
  it('parses did:vda with publicKey and network', () => {
    const { address, publicKey, network } = interpretIdentifier(`did:vda:mainnet:${pubKey}`)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toEqual(pubKey)
    expect(network).toEqual('mainnet')
  })
  it('parses did:vda with publicKey and sub-network', () => {
    const { address, publicKey, network } = interpretIdentifier(`did:vda:not:so:main:net:${pubKey}`)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toEqual(pubKey)
    expect(network).toEqual('not:so:main:net')
  })
  it('parses did:vda with publicKey and sub-network', () => {
    const { address, publicKey, network } = interpretIdentifier(`did:vda:not:so:main:net:${pubKey}?versionId=42`)
    expect(address).toEqual(checksumAddress)
    expect(publicKey).toEqual(pubKey)
    expect(network).toEqual('not:so:main:net')
  })
})
