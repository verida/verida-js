import { EthrDID } from '..'

describe('other networks', () => {
  it('supports rsk - github #50', () => {
    const ethrDid = new EthrDID({
      identifier: '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
      chainNameOrId: 'rsk',
    })
    expect(ethrDid.did).toEqual('did:ethr:rsk:0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71')
    expect(ethrDid.address).toEqual('0xC662e6c5F91B9FcD22D7FcafC80Cf8b640aed247')
  })

  it('supports rsk:testnet - github #50', () => {
    const ethrDid = new EthrDID({
      identifier: '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
      chainNameOrId: 'rsk:testnet',
    })
    expect(ethrDid.did).toEqual(
      'did:ethr:rsk:testnet:0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
    )
    expect(ethrDid.address).toEqual('0xC662e6c5F91B9FcD22D7FcafC80Cf8b640aed247')
  })

  it('supports rsk as did string', () => {
    const ethrDid = new EthrDID({
      identifier: 'did:ethr:rsk:0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
    })
    expect(ethrDid.did).toEqual('did:ethr:rsk:0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71')
    expect(ethrDid.address).toEqual('0xC662e6c5F91B9FcD22D7FcafC80Cf8b640aed247')
  })

  it('supports rsk:testnet as did string', () => {
    const ethrDid = new EthrDID({
      identifier: 'did:ethr:rsk:testnet:0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
    })
    expect(ethrDid.did).toEqual(
      'did:ethr:rsk:testnet:0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
    )
    expect(ethrDid.address).toEqual('0xC662e6c5F91B9FcD22D7FcafC80Cf8b640aed247')
  })

  it('supports rsk:testnet:custom:params as did string', () => {
    const ethrDid = new EthrDID({
      identifier:
        'did:ethr:rsk:testnet:custom:params:0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
    })
    expect(ethrDid.did).toEqual(
      'did:ethr:rsk:testnet:custom:params:0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
    )
    expect(ethrDid.address).toEqual('0xC662e6c5F91B9FcD22D7FcafC80Cf8b640aed247')
  })

  it('supports hexstring chainId', () => {
    const ethrDid = new EthrDID({
      identifier: '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
      chainNameOrId: '0x3',
    })
    expect(ethrDid.did).toEqual('did:ethr:0x3:0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71')
    expect(ethrDid.address).toEqual('0xC662e6c5F91B9FcD22D7FcafC80Cf8b640aed247')
  })

  it('supports numbered chainId', () => {
    const ethrDid = new EthrDID({
      identifier: '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
      chainNameOrId: 42,
    })
    expect(ethrDid.did).toEqual('did:ethr:0x2a:0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71')
    expect(ethrDid.address).toEqual('0xC662e6c5F91B9FcD22D7FcafC80Cf8b640aed247')
  })
})
