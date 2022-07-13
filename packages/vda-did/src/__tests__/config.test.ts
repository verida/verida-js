import { EthrDID } from '..'

describe('configuration', () => {
  it('can use rpcUrl - github #64', () => {
    const ethrDid = new EthrDID({
      // identifier: '0xC662e6c5F91B9FcD22D7FcafC80Cf8b640aed247',
      // rpcUrl: 'http://localhost:9585',
      // chainNameOrId: 1337,

      identifier: '0x44511bFfDf104fC5f61f74219f65ed4c410d4C20',
      rpcUrl: 'https://rpc-mumbai.maticvigil.com',
      chainNameOrId: 80001,
    })
    expect(ethrDid).toBeDefined()
  })
})
