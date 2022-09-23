import { Resolver, Resolvable } from 'did-resolver'
import { Contract, ContractFactory } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { getResolver } from 'ethr-did-resolver'
import { EthrDID, DelegateTypes, KeyPair } from '../index'
import { createProvider, sleep } from './testUtils'
import DidRegistryContract from 'ethr-did-registry'
import { verifyJWT } from 'did-jwt'

jest.setTimeout(30000)

describe('EthrDID', () => {
  let ethrDid: EthrDID,
    plainDid: EthrDID,
    registry: string,
    accounts: string[],
    did: string,
    identity: string,
    owner: string,
    delegate1: string,
    delegate2: string,
    resolver: Resolvable

  const provider: JsonRpcProvider = createProvider()
  
  beforeAll(async () => {
    const factory = ContractFactory.fromSolidity(DidRegistryContract).connect(provider.getSigner(0))

    console.log('Setting up configuration for')

    let registryContract: Contract
    registryContract = await factory.deploy()
    registryContract = await registryContract.deployed()

    await registryContract.deployTransaction.wait()

    registry = registryContract.address

    accounts = await provider.listAccounts()

    // accounts.map((index, item) => {
    //   console.log(index, ' - ', item)
    // })

    identity = accounts[1]
    console.log('Identity = ', identity)
    owner = accounts[2]
    delegate1 = accounts[3]
    delegate2 = accounts[4]
    did = `did:vda:dev:${identity}`

    resolver = new Resolver(getResolver({ name: 'dev', provider, registry, chainId: 1337 }))
    ethrDid = new EthrDID({
      provider,
      registry,
      identifier: identity,
      chainNameOrId: 'dev',
    })

    console.log('ethrDID = ', ethrDid)
  })

  describe('presets', () => {
    it('sets address', () => {
      expect(ethrDid.address).toEqual(identity)
    })

    it('sets did', () => {
      expect(ethrDid.did).toEqual(did)
    })
  })

  it('defaults owner to itself', () => {
    return expect(ethrDid.lookupOwner()).resolves.toEqual(identity)
  })

  describe('key management', () => {
    describe('owner changed', () => {
      beforeAll(async () => {
        await ethrDid.changeOwner(owner)
      })

      it('changes owner', () => {
        return expect(ethrDid.lookupOwner()).resolves.toEqual(owner)
      })

      it('resolves document', async () => {
        return expect((await resolver.resolve(did)).didDocument).toEqual({
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
              blockchainAccountId: `${owner}@eip155:1337`,
            },
          ],
          authentication: [`${did}#controller`],
          assertionMethod: [`${did}#controller`],
        })
      })
    })

    describe('delegates', () => {
      describe('add signing delegate', () => {
        beforeAll(async () => {
          const txHash = await ethrDid.addDelegate(delegate1, {
            expiresIn: 86400,
          })
          await provider.waitForTransaction(txHash)
        })

        it('resolves document', async () => {
          const resolution = await resolver.resolve(did)
          return expect(resolution.didDocument).toEqual({
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
                blockchainAccountId: `${owner}@eip155:1337`,
              },
              {
                id: `${did}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate1}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`],
            assertionMethod: [`${did}#controller`, `${did}#delegate-1`],
          })
        })
      })

      describe('add auth delegate', () => {
        beforeAll(async () => {
          const txHash = await ethrDid.addDelegate(delegate2, {
            delegateType: DelegateTypes.sigAuth,
            expiresIn: 2,
          })
          await provider.waitForTransaction(txHash)
        })

        it('resolves document', async () => {
          return expect((await resolver.resolve(did)).didDocument).toEqual({
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
                blockchainAccountId: `${owner}@eip155:1337`,
              },
              {
                id: `${did}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate1}@eip155:1337`,
              },
              {
                id: `${did}#delegate-2`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate2}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`, `${did}#delegate-2`],
            assertionMethod: [`${did}#controller`, `${did}#delegate-1`, `${did}#delegate-2`],
          })
        })
      })

      describe('expire automatically', () => {
        beforeAll(async () => {
          await sleep(5)
        })

        it('resolves document', async () => {
          const resolution = await resolver.resolve(did)
          return expect(resolution.didDocument).toEqual({
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
                blockchainAccountId: `${owner}@eip155:1337`,
              },
              {
                id: `${did}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate1}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`],
            assertionMethod: [`${did}#controller`, `${did}#delegate-1`],
          })
        })
      })

      describe('re-add auth delegate', () => {
        beforeAll(async () => {
          const txHash = await ethrDid.addDelegate(delegate2, {
            delegateType: DelegateTypes.sigAuth,
          })
          await provider.waitForTransaction(txHash)
        })

        it('resolves document', async () => {
          return expect((await resolver.resolve(did)).didDocument).toEqual({
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
                blockchainAccountId: `${owner}@eip155:1337`,
              },
              {
                id: `${did}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate1}@eip155:1337`,
              },
              {
                id: `${did}#delegate-3`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate2}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`, `${did}#delegate-3`],
            assertionMethod: [`${did}#controller`, `${did}#delegate-1`, `${did}#delegate-3`],
          })
        })
      })

      describe('revokes delegate', () => {
        beforeAll(async () => {
          const txHash = await ethrDid.revokeDelegate(delegate2, DelegateTypes.sigAuth)
          await provider.waitForTransaction(txHash)
        })

        it('resolves document', async () => {
          const resolution = await resolver.resolve(did)
          return expect(resolution.didDocument).toEqual({
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
                blockchainAccountId: `${owner}@eip155:1337`,
              },
              {
                id: `${did}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate1}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`],
            assertionMethod: [`${did}#controller`, `${did}#delegate-1`],
          })
        })
      })
    })

    describe('attributes', () => {
      describe('publicKey', () => {
        describe('Secp256k1VerificationKey2018', () => {
          beforeAll(async () => {
            const txHash = await ethrDid.setAttribute(
              'did/pub/Secp256k1/veriKey',
              '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
              86400
            )
            await provider.waitForTransaction(txHash)
          })

          it('resolves document', async () => {
            return expect((await resolver.resolve(did)).didDocument).toEqual({
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
                  blockchainAccountId: `${owner}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${delegate1}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-5`,
                  type: 'EcdsaSecp256k1VerificationKey2019',
                  controller: did,
                  publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                },
              ],
              authentication: [`${did}#controller`],
              assertionMethod: [`${did}#controller`, `${did}#delegate-1`, `${did}#delegate-5`],
            })
          })
        })

        describe('Base64 Encoded Key', () => {
          beforeAll(async () => {
            const txHash = await ethrDid.setAttribute(
              'did/pub/Ed25519/veriKey/base64',
              'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
              86400
            )
            await provider.waitForTransaction(txHash)
          })

          it('resolves document', async () => {
            return expect((await resolver.resolve(did)).didDocument).toEqual({
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
                  blockchainAccountId: `${owner}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${delegate1}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-5`,
                  type: 'EcdsaSecp256k1VerificationKey2019',
                  controller: did,
                  publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                },
                {
                  id: `${did}#delegate-6`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
                },
              ],
              authentication: [`${did}#controller`],
              assertionMethod: [`${did}#controller`, `${did}#delegate-1`, `${did}#delegate-5`, `${did}#delegate-6`],
            })
          })
        })

        describe('Use Buffer', () => {
          beforeAll(async () => {
            const txHash = await ethrDid.setAttribute(
              'did/pub/Ed25519/veriKey/base64',
              Buffer.from('f2b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b72', 'hex'),
              86400
            )
            await provider.waitForTransaction(txHash)
          })

          it('resolves document', async () => {
            return expect((await resolver.resolve(did)).didDocument).toEqual({
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
                  blockchainAccountId: `${owner}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${delegate1}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-5`,
                  type: 'EcdsaSecp256k1VerificationKey2019',
                  controller: did,
                  publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                },
                {
                  id: `${did}#delegate-6`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
                },
                {
                  id: `${did}#delegate-7`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty',
                },
              ],
              authentication: [`${did}#controller`],
              assertionMethod: [
                `${did}#controller`,
                `${did}#delegate-1`,
                `${did}#delegate-5`,
                `${did}#delegate-6`,
                `${did}#delegate-7`,
              ],
            })
          })
        })
      })

      describe('service endpoints', () => {
        describe('HubService', () => {
          beforeAll(async () => {
            const txHash = await ethrDid.setAttribute('did/svc/HubService', 'https://hubs.uport.me', 86400)
            await provider.waitForTransaction(txHash)
          })
          it('resolves document', async () => {
            return expect((await resolver.resolve(did)).didDocument).toEqual({
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
                  blockchainAccountId: `${owner}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${delegate1}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-5`,
                  type: 'EcdsaSecp256k1VerificationKey2019',
                  controller: did,
                  publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                },
                {
                  id: `${did}#delegate-6`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
                },
                {
                  id: `${did}#delegate-7`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty',
                },
              ],
              authentication: [`${did}#controller`],
              assertionMethod: [
                `${did}#controller`,
                `${did}#delegate-1`,
                `${did}#delegate-5`,
                `${did}#delegate-6`,
                `${did}#delegate-7`,
              ],
              service: [
                {
                  id: 'did:vda:dev:0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf#service-1',
                  type: 'HubService',
                  serviceEndpoint: 'https://hubs.uport.me',
                },
              ],
            })
          })
        })

        describe('revoke HubService', () => {
          beforeAll(async () => {
            const txHash = await ethrDid.revokeAttribute('did/svc/HubService', 'https://hubs.uport.me')
            await provider.waitForTransaction(txHash)
          })
          it('resolves document', async () => {
            return expect((await resolver.resolve(did)).didDocument).toEqual({
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
                  blockchainAccountId: `${owner}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${delegate1}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-5`,
                  type: 'EcdsaSecp256k1VerificationKey2019',
                  controller: did,
                  publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                },
                {
                  id: `${did}#delegate-6`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
                },
                {
                  id: `${did}#delegate-7`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty',
                },
              ],
              authentication: [`${did}#controller`],
              assertionMethod: [
                `${did}#controller`,
                `${did}#delegate-1`,
                `${did}#delegate-5`,
                `${did}#delegate-6`,
                `${did}#delegate-7`,
              ],
            })
          })
        })
      })
    })
  })

  describe('signJWT', () => {
    describe('No signer configured', () => {
      it('should fail', () => {
        return expect(ethrDid.signJWT({ hello: 'world' })).rejects.toEqual(new Error('No signer configured'))
      })
    })

    describe('creating a signing Delegate', () => {
      let kp: KeyPair
      beforeAll(async () => {
        kp = (await ethrDid.createSigningDelegate()).kp
      })

      it('resolves document', async () => {
        return expect((await resolver.resolve(did)).didDocument).toEqual({
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
              blockchainAccountId: `${owner}@eip155:1337`,
            },
            {
              id: `${did}#delegate-1`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${delegate1}@eip155:1337`,
            },
            {
              id: `${did}#delegate-5`,
              type: 'EcdsaSecp256k1VerificationKey2019',
              controller: did,
              publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
            },
            {
              id: `${did}#delegate-6`,
              type: 'Ed25519VerificationKey2018',
              controller: did,
              publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
            },
            {
              id: `${did}#delegate-7`,
              type: 'Ed25519VerificationKey2018',
              controller: did,
              publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty',
            },
            {
              id: `${did}#delegate-8`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${kp.address}@eip155:1337`,
            },
          ],
          authentication: [`${did}#controller`],
          assertionMethod: [
            `${did}#controller`,
            `${did}#delegate-1`,
            `${did}#delegate-5`,
            `${did}#delegate-6`,
            `${did}#delegate-7`,
            `${did}#delegate-8`,
          ],
        })
      })

      it('should sign valid jwt', () => {
        return ethrDid.signJWT({ hello: 'world' }).then((jwt: string) =>
          verifyJWT(jwt, { resolver }).then(
            ({ signer }) =>
              expect(signer).toEqual({
                id: `${did}#delegate-8`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${kp.address}@eip155:1337`,
              }),
            (error) => expect(error).toBeNull()
          )
        )
      })
    })

    describe('plain vanilla key pair account', () => {
      it('should sign valid jwt', async () => {
        const kp: KeyPair = EthrDID.createKeyPair('dev')
        plainDid = new EthrDID({
          ...kp,
          provider,
          registry: registry,
        })
        const jwt = await plainDid.signJWT({ hello: 'world' })
        const { payload } = await verifyJWT(jwt, { resolver })
        expect(payload).toBeDefined()
      })
    })
  })

  describe('verifyJWT', () => {
    const ethrDidAsIssuer = new EthrDID(EthrDID.createKeyPair('dev'))
    const did = ethrDidAsIssuer.did

    it('verifies the signature of the JWT', async () => {
      expect.assertions(1)
      return ethrDidAsIssuer
        .signJWT({ hello: 'friend' })
        .then((jwt) => plainDid.verifyJWT(jwt, resolver))
        .then(({ issuer }) => expect(issuer).toEqual(did))
    })

    describe('uses did for verifying aud claim', () => {
      it('verifies the signature of the JWT', () => {
        expect.assertions(1)
        return ethrDidAsIssuer
          .signJWT({ hello: 'friend', aud: plainDid.did })
          .then((jwt) => plainDid.verifyJWT(jwt, resolver))
          .then(({ issuer }) => expect(issuer).toEqual(did))
      })

      it('fails if wrong did is used as audience', async () => {
        expect.assertions(1)
        const signed = await ethrDidAsIssuer.signJWT({ hello: 'friend', aud: 'some random audience' })
        try {
          await plainDid.verifyJWT(signed, resolver)
        } catch (e) {
          expect(e).toEqual(Error(`invalid_config: JWT audience does not match your DID or callback url`))
        }
      })
    })
  })

  describe('Large key', () => {
    const rsa4096PublicKey = `-----BEGIN PUBLIC KEY-----
            MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAolN9csarxOP++9pbjLE/
            /ybicmTGL0+or6LmLkos9YEXOb8w1RaoQoLuPNbCqfHlnbiPdvl9zdVHCswf9DwK
            Ba6ecs0Vr3OW3FTSyejHiqinkfmEgRKOoAf7S8nQcsiDzANPondL+1z+dgmo8nTK
            9806ei8LYzKzLjpi+SmdtTVvUQZGuxAT1GuzzT5jyE+MyR2zwSaCTyNC6zwnk51i
            z+zf8WRNe32WtBLhNbz6MKlwup1CSear9oeZQJRQspkud7b84Clv6QeOCPqMuRLy
            ibM8J+BC5cRyxVyV2rHshvD134cbR6uEIsggoC9NvvZcaJlcG25gA7rUrIJ8CGEG
            9WZsmqUfrykOJ3HFqGyJZlpVq0hHM6ikcexdbqPFcwj9Vcx3yecb6WABZCeYVHDw
            3AoGu/Y/m2xJ7L3iPCWcpB94y0e7Yp3M6S8Y4RpL2iEykCXd7CVYVV1QVPz4/5D8
            mT4S4PG0I0/yBbblUz9CcYSJ/9eFOekSRY7TAEEJcrBY7MkXZcNRwcFtgi9PWpaC
            XTsIYri2eBKqAgFT9xaPiFCFYJlpfUe81pgp+5mZsObYlB0AKJb7o0rRa5XLO4JL
            ZiovTaqHZW9gvO3KZyJNYx7XM9Vjwm4FB5NUxSvqHJyUgGC6H7jwK2wKtrThrjkt
            P9+7B63q+4nzilC9UUHEIosCAwEAAQ==
            -----END PUBLIC KEY-----`

    beforeAll(async () => {
      const txHash = await ethrDid.setAttribute('did/pub/Rsa/veriKey/pem', rsa4096PublicKey, 86400, 200000)
      await provider.waitForTransaction(txHash)
    })

    it('should create add the large RSA key in the hex format', async () => {
      const didDocument = (await resolver.resolve(did)).didDocument
      const pk = didDocument?.verificationMethod?.find((pk) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return typeof (<any>pk).publicKeyPem !== 'undefined'
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((<any>pk).publicKeyPem).toEqual(rsa4096PublicKey)
    })
  })

  describe('base58 key', () => {
    const publicKeyBase58 = 'SYnSwQmBmVwrHoGo6mnqFCX28sr3UzAZw9yyiBTLaf2foDfxDTgNdpn3MPD4gUGi4cgunK8cnGbPS5yjVh5uAXGr'

    it('supports base58 keys as hexstring', async () => {
      const publicKeyHex =
        '04fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea535847946393f8145252eea68afe67e287b3ed9b31685ba6c3b00060a73b9b1242d68f7'
      const did = `did:vda:dev:${delegate1}`
      const didController = new EthrDID({
        identifier: did,
        provider,
        registry,
      })
      const txHash = await didController.setAttribute('did/pub/Secp256k1/veriKey/base58', `0x${publicKeyHex}`, 86400)
      await provider.waitForTransaction(txHash)
      const doc = (await resolver.resolve(did)).didDocument
      expect(doc?.verificationMethod).toEqual([
        {
          blockchainAccountId: `${delegate1}@eip155:1337`,
          controller: did,
          id: `${did}#controller`,
          type: 'EcdsaSecp256k1RecoveryMethod2020',
        },
        {
          controller: did,
          id: `${did}#delegate-1`,
          publicKeyBase58,
          type: 'EcdsaSecp256k1VerificationKey2019',
        },
      ])
    })

    it('supports base58 keys as string', async () => {
      const did = `did:vda:dev:${delegate2}`
      const didController = new EthrDID({
        identifier: did,
        provider,
        registry,
      })
      const txHash = await didController.setAttribute('did/pub/Secp256k1/veriKey/base58', publicKeyBase58, 86400)
      await provider.waitForTransaction(txHash)
      const doc = (await resolver.resolve(did)).didDocument
      expect(doc?.verificationMethod).toEqual([
        {
          blockchainAccountId: `${delegate2}@eip155:1337`,
          controller: did,
          id: `${did}#controller`,
          type: 'EcdsaSecp256k1RecoveryMethod2020',
        },
        {
          controller: did,
          id: `${did}#delegate-1`,
          publicKeyBase58,
          type: 'EcdsaSecp256k1VerificationKey2019',
        },
      ])
    })
  })
})
