import { Contract, ContractFactory } from '@ethersproject/contracts'
import { Resolvable, Resolver } from 'did-resolver'
import { getResolver } from '../resolver'
import { VdaDidController } from '../controller'
import DidRegistryContract from 'ethr-did-registry'
import { interpretIdentifier, stringToBytes32 } from '../helpers'
import { createProvider, sleep, startMining, stopMining } from './testUtils'
import { nullAddress } from '../helpers'

jest.setTimeout(30000)

describe('ethrResolver', () => {
  // let registry, accounts, did, identity, controller, delegate1, delegate2, ethr, didResolver
  let registryContract: Contract,
    accounts: string[],
    did: string,
    identity: string,
    controller: string,
    delegate1: string,
    delegate2: string,
    keyAgreementController: string,
    didResolver: Resolvable

  const web3Provider = createProvider()

  beforeAll(async () => {
    const factory = ContractFactory.fromSolidity(DidRegistryContract).connect(web3Provider.getSigner(0))

    registryContract = await factory.deploy()
    registryContract = await registryContract.deployed()

    await registryContract.deployTransaction.wait()

    const registry = registryContract.address

    accounts = await web3Provider.listAccounts()

    identity = accounts[1]
    controller = accounts[2]
    delegate1 = accounts[3]
    delegate2 = accounts[4]
    keyAgreementController = accounts[5]
    did = `did:ethr:dev:${identity}`

    didResolver = new Resolver(getResolver({ name: 'dev', provider: web3Provider, registry }))
  })

  describe('unregistered', () => {
    it('resolves document', async () => {
      expect.assertions(1)
      await expect(didResolver.resolve(did)).resolves.toEqual({
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
              blockchainAccountId: `${identity}@eip155:1337`,
            },
          ],
          authentication: [`${did}#controller`],
          assertionMethod: [`${did}#controller`],
        },
      })
    })

    it('resolves document with publicKey identifier', async () => {
      expect.assertions(1)
      const pubKey = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
      const pubdid = `did:ethr:dev:0x${pubKey}`
      await expect(didResolver.resolve(pubdid)).resolves.toEqual({
        didDocumentMetadata: {},
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
          ],
          id: pubdid,
          verificationMethod: [
            {
              id: `${pubdid}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: pubdid,
              blockchainAccountId: `${identity}@eip155:1337`,
            },
            {
              id: `${pubdid}#controllerKey`,
              type: 'EcdsaSecp256k1VerificationKey2019',
              controller: pubdid,
              publicKeyHex: pubKey,
            },
          ],
          authentication: [`${pubdid}#controller`, `${pubdid}#controllerKey`],
          assertionMethod: [`${pubdid}#controller`, `${pubdid}#controllerKey`],
        },
      })
    })
  })

  describe('controller changed', () => {
    it('resolves document', async () => {
      expect.assertions(1)
      const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
      await new VdaDidController(identity, registryContract).changeOwner(controller, { from: identity })
      const result = await didResolver.resolve(did)
      expect(result).toEqual({
        didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 1}`, updated: expect.anything() },
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
              blockchainAccountId: `${controller}@eip155:1337`,
            },
          ],
          authentication: [`${did}#controller`],
          assertionMethod: [`${did}#controller`],
        },
      })
    })

    it('changing controller invalidates the publicKey as identifier', async () => {
      expect.assertions(3)
      const pubKey = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
      const pubdid = `did:ethr:dev:0x${pubKey}`
      const { didDocument } = await didResolver.resolve(pubdid)
      expect(didDocument).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
        ],
        id: pubdid,
        verificationMethod: [
          {
            id: `${pubdid}#controller`,
            type: 'EcdsaSecp256k1RecoveryMethod2020',
            controller: pubdid,
            blockchainAccountId: `${controller}@eip155:1337`,
          },
        ],
        authentication: [`${pubdid}#controller`],
        assertionMethod: [`${pubdid}#controller`],
      })
      expect(didDocument?.verificationMethod?.length).toBe(1)
      expect(didDocument?.authentication?.length).toBe(1)
    })
  })

  describe('delegates', () => {
    describe('add signing delegate', () => {
      it('resolves document', async () => {
        expect.assertions(1)
        const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
        await new VdaDidController(identity, registryContract).addDelegate('veriKey', delegate1, 86401, {
          from: controller,
        })
        const result = await didResolver.resolve(did)
        await expect(result).toEqual({
          didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 1}`, updated: expect.anything() },
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
                blockchainAccountId: `${controller}@eip155:1337`,
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
          },
        })
      })
    })

    describe('add auth delegate', () => {
      it('resolves document', async () => {
        expect.assertions(1)
        const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
        await new VdaDidController(identity, registryContract).addDelegate('sigAuth', delegate2, 1, {
          from: controller,
        })
        const result = await didResolver.resolve(did)
        expect(result).toEqual({
          didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 1}`, updated: expect.anything() },
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
                blockchainAccountId: `${controller}@eip155:1337`,
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
          },
        })
      })
    })

    describe('expire automatically', () => {
      it('resolves document', async () => {
        expect.assertions(1)
        //key validity was set to less than 2 seconds
        await sleep(4000)
        const result = await didResolver.resolve(did)
        expect(result).toEqual({
          didDocumentMetadata: expect.anything(),
          didResolutionMetadata: expect.anything(),
          didDocument: {
            '@context': expect.anything(),
            id: did,
            verificationMethod: [
              {
                id: `${did}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${controller}@eip155:1337`,
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
          },
        })
      })
    })

    describe('revokes delegate', () => {
      it('resolves document', async () => {
        expect.assertions(1)
        const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
        await new VdaDidController(identity, registryContract).revokeDelegate('veriKey', delegate1, {
          from: controller,
        })
        await sleep(1000)
        const result = await didResolver.resolve(did)
        expect(result).toEqual({
          didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 1}`, updated: expect.anything() },
          didResolutionMetadata: expect.anything(),
          didDocument: {
            '@context': expect.anything(),
            id: did,
            verificationMethod: [
              {
                id: `${did}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${controller}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`],
            assertionMethod: [`${did}#controller`],
          },
        })
      })
    })

    describe('re-add auth delegate', () => {
      it('resolves document', async () => {
        expect.assertions(1)
        const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
        await new VdaDidController(identity, registryContract).addDelegate('sigAuth', delegate2, 86402, {
          from: controller,
        })
        const result = await didResolver.resolve(did)
        expect(result).toEqual({
          didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 1}`, updated: expect.anything() },
          didResolutionMetadata: expect.anything(),
          didDocument: {
            '@context': expect.anything(),
            id: did,
            verificationMethod: [
              {
                id: `${did}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${controller}@eip155:1337`,
              },
              {
                id: `${did}#delegate-4`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate2}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`, `${did}#delegate-4`],
            assertionMethod: [`${did}#controller`, `${did}#delegate-4`],
          },
        })
      })
    })
  })

  describe('attributes', () => {
    describe('add publicKey', () => {
      it('resolves with EcdsaSecp256k1VerificationKey2019', async () => {
        expect.assertions(1)
        await new VdaDidController(identity, registryContract).setAttribute(
          'did/pub/Secp256k1/veriKey',
          '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
          86401,
          { from: controller }
        )
        const { didDocument } = await didResolver.resolve(did)
        expect(didDocument).toEqual({
          '@context': expect.anything(),
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${controller}@eip155:1337`,
            },
            {
              id: `${did}#delegate-4`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${delegate2}@eip155:1337`,
            },
            {
              id: `${did}#delegate-5`,
              type: 'EcdsaSecp256k1VerificationKey2019',
              controller: did,
              publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
            },
          ],
          authentication: [`${did}#controller`, `${did}#delegate-4`],
          assertionMethod: [`${did}#controller`, `${did}#delegate-4`, `${did}#delegate-5`],
        })
      })

      it('resolves with Ed25519VerificationKey2018', async () => {
        expect.assertions(1)
        await new VdaDidController(identity, registryContract).setAttribute(
          'did/pub/Ed25519/veriKey/base64',
          '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
          86402,
          { from: controller }
        )
        const { didDocument } = await didResolver.resolve(did)
        expect(didDocument).toEqual({
          '@context': expect.anything(),
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${controller}@eip155:1337`,
            },
            {
              id: `${did}#delegate-4`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${delegate2}@eip155:1337`,
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
              publicKeyBase64: Buffer.from(
                '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                'hex'
              ).toString('base64'),
            },
          ],
          authentication: [`${did}#controller`, `${did}#delegate-4`],
          assertionMethod: [`${did}#controller`, `${did}#delegate-4`, `${did}#delegate-5`, `${did}#delegate-6`],
        })
      })

      it('resolves with RSAVerificationKey2018', async () => {
        expect.assertions(1)
        await new VdaDidController(identity, registryContract).setAttribute(
          'did/pub/RSA/veriKey/pem',
          '-----BEGIN PUBLIC KEY...END PUBLIC KEY-----\r\n',
          86403,
          { from: controller }
        )
        const { didDocument } = await didResolver.resolve(did)
        expect(didDocument).toEqual({
          '@context': expect.anything(),
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${controller}@eip155:1337`,
            },
            {
              id: `${did}#delegate-4`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${delegate2}@eip155:1337`,
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
              publicKeyBase64: Buffer.from(
                '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                'hex'
              ).toString('base64'),
            },
            {
              id: `${did}#delegate-7`,
              type: 'RSAVerificationKey2018',
              controller: did,
              publicKeyPem: '-----BEGIN PUBLIC KEY...END PUBLIC KEY-----\r\n',
            },
          ],
          authentication: [`${did}#controller`, `${did}#delegate-4`],
          assertionMethod: [
            `${did}#controller`,
            `${did}#delegate-4`,
            `${did}#delegate-5`,
            `${did}#delegate-6`,
            `${did}#delegate-7`,
          ],
        })
      })

      it('resolves with X25519KeyAgreementKey2019', async () => {
        expect.assertions(1)
        const keyAgrDid = `did:ethr:dev:${keyAgreementController}`
        await new VdaDidController(keyAgreementController, registryContract).setAttribute(
          'did/pub/X25519/enc/base64',
          `0x${Buffer.from('MCowBQYDK2VuAyEAEYVXd3/7B4d0NxpSsA/tdVYdz5deYcR1U+ZkphdmEFI=', 'base64').toString('hex')}`,
          86404,
          { from: keyAgreementController }
        )
        const { didDocument } = await didResolver.resolve(keyAgrDid)
        expect(didDocument).toEqual({
          '@context': expect.anything(),
          id: keyAgrDid,
          verificationMethod: [
            {
              id: `${keyAgrDid}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: keyAgrDid,
              blockchainAccountId: `${keyAgreementController}@eip155:1337`,
            },
            {
              id: `${keyAgrDid}#delegate-1`,
              type: 'X25519KeyAgreementKey2019',
              controller: keyAgrDid,
              publicKeyBase64: 'MCowBQYDK2VuAyEAEYVXd3/7B4d0NxpSsA/tdVYdz5deYcR1U+ZkphdmEFI=',
            },
          ],
          authentication: [`${keyAgrDid}#controller`],
          assertionMethod: [`${keyAgrDid}#controller`, `${keyAgrDid}#delegate-1`],
          keyAgreement: [`${keyAgrDid}#delegate-1`],
        })
      })
    })

    describe('add service endpoints', () => {
      it('resolves document', async () => {
        expect.assertions(1)
        await new VdaDidController(identity, registryContract).setAttribute(
          stringToBytes32('did/svc/HubService'),
          'https://hubs.uport.me',
          86405,
          { from: controller }
        )
        const { didDocument } = await didResolver.resolve(did)
        expect(didDocument).toEqual({
          '@context': expect.anything(),
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${controller}@eip155:1337`,
            },
            {
              id: `${did}#delegate-4`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${delegate2}@eip155:1337`,
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
              publicKeyBase64: Buffer.from(
                '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                'hex'
              ).toString('base64'),
            },
            {
              id: `${did}#delegate-7`,
              type: 'RSAVerificationKey2018',
              controller: did,
              publicKeyPem: '-----BEGIN PUBLIC KEY...END PUBLIC KEY-----\r\n',
            },
          ],
          authentication: [`${did}#controller`, `${did}#delegate-4`],
          assertionMethod: [
            `${did}#controller`,
            `${did}#delegate-4`,
            `${did}#delegate-5`,
            `${did}#delegate-6`,
            `${did}#delegate-7`,
          ],
          service: [
            {
              id: `${did}#service-1`,
              type: 'HubService',
              serviceEndpoint: 'https://hubs.uport.me',
            },
          ],
        })
      })
    })
  })

  describe('revoke publicKey', () => {
    it('resolves without EcdsaSecp256k1VerificationKey2019', async () => {
      expect.assertions(1)
      await new VdaDidController(identity, registryContract).revokeAttribute(
        'did/pub/Secp256k1/veriKey',
        '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
        { from: controller }
      )
      const { didDocument } = await didResolver.resolve(did)
      expect(didDocument).toEqual({
        '@context': expect.anything(),
        id: did,
        verificationMethod: [
          {
            id: `${did}#controller`,
            type: 'EcdsaSecp256k1RecoveryMethod2020',
            controller: did,
            blockchainAccountId: `${controller}@eip155:1337`,
          },
          {
            id: `${did}#delegate-4`,
            type: 'EcdsaSecp256k1RecoveryMethod2020',
            controller: did,
            blockchainAccountId: `${delegate2}@eip155:1337`,
          },
          {
            id: `${did}#delegate-6`,
            type: 'Ed25519VerificationKey2018',
            controller: did,
            publicKeyBase64: Buffer.from(
              '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
              'hex'
            ).toString('base64'),
          },
          {
            id: `${did}#delegate-7`,
            type: 'RSAVerificationKey2018',
            controller: did,
            publicKeyPem: '-----BEGIN PUBLIC KEY...END PUBLIC KEY-----\r\n',
          },
        ],
        authentication: [`${did}#controller`, `${did}#delegate-4`],
        assertionMethod: [`${did}#controller`, `${did}#delegate-4`, `${did}#delegate-6`, `${did}#delegate-7`],
        service: [
          {
            id: `${did}#service-1`,
            type: 'HubService',
            serviceEndpoint: 'https://hubs.uport.me',
          },
        ],
      })
    })

    it('resolves without Ed25519VerificationKey2018', async () => {
      expect.assertions(1)
      await new VdaDidController(identity, registryContract).revokeAttribute(
        'did/pub/Ed25519/veriKey/base64',
        '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
        { from: controller }
      )
      const { didDocument } = await didResolver.resolve(did)
      expect(didDocument).toEqual({
        '@context': expect.anything(),
        id: did,
        verificationMethod: [
          {
            id: `${did}#controller`,
            type: 'EcdsaSecp256k1RecoveryMethod2020',
            controller: did,
            blockchainAccountId: `${controller}@eip155:1337`,
          },
          {
            id: `${did}#delegate-4`,
            type: 'EcdsaSecp256k1RecoveryMethod2020',
            controller: did,
            blockchainAccountId: `${delegate2}@eip155:1337`,
          },
          {
            id: `${did}#delegate-7`,
            type: 'RSAVerificationKey2018',
            controller: did,
            publicKeyPem: '-----BEGIN PUBLIC KEY...END PUBLIC KEY-----\r\n',
          },
        ],
        authentication: [`${did}#controller`, `${did}#delegate-4`],
        assertionMethod: [`${did}#controller`, `${did}#delegate-4`, `${did}#delegate-7`],
        service: [
          {
            id: `${did}#service-1`,
            type: 'HubService',
            serviceEndpoint: 'https://hubs.uport.me',
          },
        ],
      })
    })

    it('resolves without RSAVerificationKey2018', async () => {
      expect.assertions(1)
      await new VdaDidController(identity, registryContract).revokeAttribute(
        stringToBytes32('did/pub/RSA/veriKey/pem'),
        '-----BEGIN PUBLIC KEY...END PUBLIC KEY-----\r\n',
        { from: controller }
      )
      const { didDocument } = await didResolver.resolve(did)
      expect(didDocument).toEqual({
        '@context': expect.anything(),
        id: did,
        verificationMethod: [
          {
            id: `${did}#controller`,
            type: 'EcdsaSecp256k1RecoveryMethod2020',
            controller: did,
            blockchainAccountId: `${controller}@eip155:1337`,
          },
          {
            id: `${did}#delegate-4`,
            type: 'EcdsaSecp256k1RecoveryMethod2020',
            controller: did,
            blockchainAccountId: `${delegate2}@eip155:1337`,
          },
        ],
        authentication: [`${did}#controller`, `${did}#delegate-4`],
        assertionMethod: [`${did}#controller`, `${did}#delegate-4`],
        service: [
          {
            id: `${did}#service-1`,
            type: 'HubService',
            serviceEndpoint: 'https://hubs.uport.me',
          },
        ],
      })
    })

    describe('revoke service endpoints', () => {
      it('resolves without HubService', async () => {
        expect.assertions(1)
        await new VdaDidController(identity, registryContract).revokeAttribute(
          stringToBytes32('did/svc/HubService'),
          'https://hubs.uport.me',
          { from: controller }
        )
        const { didDocument } = await didResolver.resolve(did)
        expect(didDocument).toEqual({
          '@context': expect.anything(),
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${controller}@eip155:1337`,
            },
            {
              id: `${did}#delegate-4`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${delegate2}@eip155:1337`,
            },
          ],
          authentication: [`${did}#controller`, `${did}#delegate-4`],
          assertionMethod: [`${did}#controller`, `${did}#delegate-4`],
        })
      })
    })
  })

  describe('regression', () => {
    it('resolves same document with case sensitive eth address (https://github.com/decentralized-identity/ethr-did-resolver/issues/105)', async () => {
      expect.assertions(3)
      const lowAddress = accounts[5].toLowerCase()
      const checksumAddress = interpretIdentifier(lowAddress).address
      const lowDid = `did:ethr:dev:${lowAddress}`
      const checksumDid = `did:ethr:dev:${checksumAddress}`
      await new VdaDidController(lowAddress, registryContract).setAttribute(
        'did/pub/Secp256k1/veriKey/hex',
        '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
        86409,
        { from: lowAddress }
      )
      const didDocumentLow = (await didResolver.resolve(lowDid)).didDocument
      const didDocumentChecksum = (await didResolver.resolve(checksumDid)).didDocument
      expect(lowDid).not.toEqual(checksumDid)
      expect(didDocumentLow).toBeDefined()
      //we don't care about the actual keys, only about their sameness
      expect(JSON.stringify(didDocumentLow).toLowerCase()).toEqual(JSON.stringify(didDocumentChecksum).toLowerCase())
    })

    it('adds sigAuth to authentication section (https://github.com/decentralized-identity/ethr-did-resolver/issues/95)', async () => {
      expect.assertions(1)
      const address = accounts[4]
      const identifier = `did:ethr:dev:${address}`
      const authPubKey = `31303866356238393330623164633235386162353765386630646362363932353963363162316166`
      await new VdaDidController(identifier, registryContract).setAttribute(
        'did/pub/Ed25519/sigAuth/hex',
        `0x${authPubKey}`,
        86410,
        { from: address }
      )
      const { didDocument } = await didResolver.resolve(identifier)
      expect(didDocument).toEqual({
        '@context': expect.anything(),
        id: identifier,
        verificationMethod: [
          {
            id: `${identifier}#controller`,
            controller: identifier,
            type: 'EcdsaSecp256k1RecoveryMethod2020',
            blockchainAccountId: `${address}@eip155:1337`,
          },
          {
            id: `${identifier}#delegate-1`,
            controller: identifier,
            type: `Ed25519VerificationKey2018`,
            publicKeyHex: authPubKey,
          },
        ],
        authentication: [`${identifier}#controller`, `${identifier}#delegate-1`],
        assertionMethod: [`${identifier}#controller`, `${identifier}#delegate-1`],
      })
    })

    describe('Ed25519VerificationKey2018 in base58 (https://github.com/decentralized-identity/ethr-did-resolver/pull/106)', () => {
      it('resolves document', async () => {
        expect.assertions(1)
        const address = accounts[3]
        const identifier = `did:ethr:dev:${address}`
        const publicKeyHex = `b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71`
        const expectedPublicKeyBase58 = 'DV4G2kpBKjE6zxKor7Cj21iL9x9qyXb6emqjszBXcuhz'
        const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
        await new VdaDidController(identifier, registryContract).setAttribute(
          'did/pub/Ed25519/veriKey/base58',
          `0x${publicKeyHex}`,
          86411,
          { from: address }
        )
        const result = await didResolver.resolve(identifier)
        expect(result).toEqual({
          didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 1}`, updated: expect.anything() },
          didResolutionMetadata: expect.anything(),
          didDocument: {
            '@context': expect.anything(),
            id: identifier,
            verificationMethod: [
              {
                id: `${identifier}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: identifier,
                blockchainAccountId: `${address}@eip155:1337`,
              },
              {
                id: `${identifier}#delegate-1`,
                type: 'Ed25519VerificationKey2018',
                controller: identifier,
                publicKeyBase58: expectedPublicKeyBase58,
              },
            ],
            authentication: [`${identifier}#controller`],
            assertionMethod: [`${identifier}#controller`, `${identifier}#delegate-1`],
          },
        })
      })
    })

    describe('can deactivate a DID (https://github.com/decentralized-identity/ethr-did-resolver/issues/83)', () => {
      it('resolves deactivated document', async () => {
        expect.assertions(1)
        const address = accounts[6]
        const identifier = `did:ethr:dev:${address}`
        const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
        await new VdaDidController(identifier, registryContract).changeOwner(nullAddress, { from: address })
        const result = await didResolver.resolve(identifier)
        expect(result).toEqual({
          didDocumentMetadata: {
            deactivated: true,
            updated: expect.anything(),
            versionId: `${blockHeightBeforeChange + 1}`,
          },
          didResolutionMetadata: expect.anything(),
          didDocument: {
            '@context': 'https://www.w3.org/ns/did/v1',
            id: identifier,
            verificationMethod: [],
            authentication: [],
            assertionMethod: [],
          },
        })
      })
    })

    describe('versioning', () => {
      it('can resolve virgin DID with versionId=latest', async () => {
        expect.assertions(1)
        const virginAddress = '0xce3080168EE293053bA33b235D7116a3263D29f1'
        const virginDID = `did:ethr:dev:${virginAddress}`
        const result = await didResolver.resolve(`${virginDID}?versionId=latest`)
        expect(result).toEqual({
          didDocumentMetadata: {},
          didResolutionMetadata: {
            contentType: 'application/did+ld+json',
          },
          didDocument: {
            '@context': [
              'https://www.w3.org/ns/did/v1',
              'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
            ],
            id: virginDID,
            verificationMethod: [
              {
                id: `${virginDID}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: virginDID,
                blockchainAccountId: `${virginAddress}@eip155:1337`,
              },
            ],
            authentication: [`${virginDID}#controller`],
            assertionMethod: [`${virginDID}#controller`],
          },
        })
      })

      it('can resolve did with versionId before deactivation', async () => {
        expect.assertions(1)
        const deactivatedDid = `did:ethr:dev:${accounts[6]}`
        const { didDocumentMetadata } = await didResolver.resolve(deactivatedDid)
        const deactivationBlock = parseInt(didDocumentMetadata.versionId ?? '')
        const result = await didResolver.resolve(`${deactivatedDid}?versionId=${deactivationBlock - 1}`)
        expect(result).toEqual({
          didDocumentMetadata: {
            nextVersionId: `${deactivationBlock}`,
            nextUpdate: didDocumentMetadata.updated
          },
          didResolutionMetadata: { contentType: 'application/did+ld+json' },
          didDocument: {
            '@context': [
              'https://www.w3.org/ns/did/v1',
              'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
            ],
            id: deactivatedDid,
            verificationMethod: [
              {
                id: `${deactivatedDid}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: deactivatedDid,
                blockchainAccountId: `${accounts[6]}@eip155:1337`,
              },
            ],
            authentication: [`${deactivatedDid}#controller`],
            assertionMethod: [`${deactivatedDid}#controller`],
          },
        })
      })

      it('can resolve modified did with versionId=latest', async () => {
        expect.assertions(1)
        const address = accounts[7]
        const identifier = `did:ethr:dev:${address}`
        const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
        // change owner to self
        await new VdaDidController(identifier, registryContract).changeOwner(address, { from: address })
        const result = await didResolver.resolve(`${identifier}?versionId=latest`)
        expect(result).toEqual({
          didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 1}`, updated: expect.anything() },
          didResolutionMetadata: expect.anything(),
          didDocument: {
            '@context': expect.anything(),
            id: identifier,
            verificationMethod: [
              {
                id: `${identifier}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: identifier,
                blockchainAccountId: `${address}@eip155:1337`,
              },
            ],
            authentication: [`${identifier}#controller`],
            assertionMethod: [`${identifier}#controller`],
          },
        })
      })

      it('can resolve did with versionId before an attribute change', async () => {
        expect.assertions(1)

        const address = accounts[8]
        const identifier = `did:ethr:dev:${address}`

        const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
        const ethrDid = new VdaDidController(identifier, registryContract)
        await ethrDid.setAttribute(
          'did/pub/Ed25519/veriKey/hex',
          `0x11111111`,
          86411,
          { from: address }
        )
        await ethrDid.setAttribute(
          'did/pub/Ed25519/veriKey/hex',
          `0x22222222`,
          86412,
          { from: address }
        )

        const result = await didResolver.resolve(`${identifier}?versionId=${blockHeightBeforeChange + 1}`)
        expect(result).toEqual({
          didDocumentMetadata: {
            versionId: `${blockHeightBeforeChange + 1}`,
            nextVersionId: `${blockHeightBeforeChange + 2}`,
            updated: expect.anything(),
            nextUpdate: expect.anything()
          },
          didResolutionMetadata: { contentType: 'application/did+ld+json' },
          didDocument: {
            '@context': expect.anything(),
            id: identifier,
            verificationMethod: [
              {
                id: `${identifier}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: identifier,
                blockchainAccountId: `${address}@eip155:1337`,
              },
              {
                id: `${identifier}#delegate-1`,
                type: 'Ed25519VerificationKey2018',
                controller: identifier,
                publicKeyHex: '11111111',
              },
            ],
            authentication: [`${identifier}#controller`],
            assertionMethod: [`${identifier}#controller`, `${identifier}#delegate-1`],
          },
        })
      })

      it('can resolve did with versionId before a delegate change', async () => {
        expect.assertions(1)
        const delegateAddress1 = '0xde1E9a7e00000000000000000000000000000001'
        const delegateAddress2 = '0xde1e9a7e00000000000000000000000000000002'
        const address = accounts[9]
        const identifier = `did:ethr:dev:${address}`

        const ethrDid = new VdaDidController(identifier, registryContract)
        const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
        await ethrDid.addDelegate('veriKey', delegateAddress1, 86401, { from: address })
        await ethrDid.addDelegate('veriKey', delegateAddress2, 86402, { from: address })

        const result = await didResolver.resolve(`${identifier}?versionId=${blockHeightBeforeChange + 1}`)
        expect(result).toEqual({
          didDocumentMetadata: {
            versionId: `${blockHeightBeforeChange + 1}`,
            nextVersionId: `${blockHeightBeforeChange + 2}`,
            updated: expect.anything(),
            nextUpdate: expect.anything()
          },
          didResolutionMetadata: expect.anything(),
          didDocument: {
            '@context': expect.anything(),
            id: identifier,
            verificationMethod: [
              {
                id: `${identifier}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: identifier,
                blockchainAccountId: `${address}@eip155:1337`,
              },
              {
                id: `${identifier}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: identifier,
                blockchainAccountId: `${delegateAddress1}@eip155:1337`,
              },
            ],
            authentication: [`${identifier}#controller`],
            assertionMethod: [`${identifier}#controller`, `${identifier}#delegate-1`],
          },
        })
      })

      it('can resolve did with versionId before an owner change', async () => {
        expect.assertions(1)
        const newOwner = '0xde1e9a7e00000000000000000000000000000003'
        const address = accounts[10]
        const identifier = `did:ethr:dev:${address}`

        const ethrDid = new VdaDidController(identifier, registryContract)
        const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
        await ethrDid.changeOwner(address, { from: address })
        await ethrDid.changeOwner(newOwner, { from: address })
        const result = await didResolver.resolve(`${identifier}?versionId=${blockHeightBeforeChange + 1}`)
        expect(result).toEqual({
          didDocumentMetadata: {
            versionId: `${blockHeightBeforeChange + 1}`,
            nextVersionId: `${blockHeightBeforeChange + 2}`,
            updated: expect.anything(),
            nextUpdate: expect.anything()
          },
          didResolutionMetadata: expect.anything(),
          didDocument: {
            '@context': expect.anything(),
            id: identifier,
            verificationMethod: [
              {
                id: `${identifier}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: identifier,
                blockchainAccountId: `${address}@eip155:1337`,
              },
            ],
            authentication: [`${identifier}#controller`],
            assertionMethod: [`${identifier}#controller`],
          },
        })
      })

      it('can resolve did with versionId before an attribute expiration', async () => {
        expect.assertions(3)
        const delegate = '0xde1E9a7e00000000000000000000000000000001'
        const address = accounts[11]
        const identifier = `did:ethr:dev:${address}`

        await new VdaDidController(identifier, registryContract).addDelegate('sigAuth', delegate, 1, {
          from: address,
        })
        let result = await didResolver.resolve(identifier)
        // confirm delegate exists
        const versionBeforeExpiry = result.didDocumentMetadata.versionId
        expect(result?.didDocument?.verificationMethod?.[1]).toEqual({
          id: `${identifier}#delegate-1`,
          type: 'EcdsaSecp256k1RecoveryMethod2020',
          controller: identifier,
          blockchainAccountId: `${delegate}@eip155:1337`,
        })
        // await expiry
        await sleep(4000)
        // confirm delegate was removed after expiry
        result = await didResolver.resolve(identifier)
        expect(result?.didDocument?.verificationMethod?.length).toEqual(1)

        // resolve DID before expiry
        result = await didResolver.resolve(`${identifier}?versionId=${versionBeforeExpiry}`)
        expect(result).toEqual({
          didDocumentMetadata: { versionId: `${versionBeforeExpiry}`, updated: expect.anything() },
          didResolutionMetadata: expect.anything(),
          didDocument: {
            '@context': expect.anything(),
            id: identifier,
            verificationMethod: [
              {
                id: `${identifier}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: identifier,
                blockchainAccountId: `${address}@eip155:1337`,
              },
              {
                id: `${identifier}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: identifier,
                blockchainAccountId: `${delegate}@eip155:1337`,
              },
            ],
            authentication: [`${identifier}#controller`, `${identifier}#delegate-1`],
            assertionMethod: [`${identifier}#controller`, `${identifier}#delegate-1`],
          },
        })
      })
    })
  })

  describe('overlapping events', () => {
    it('adding the same service in the same block does not result in duplication', async () => {
      expect.assertions(1)

      const address = accounts[12]
      const identifier = `did:ethr:dev:${address}`

      const ethrDid = new VdaDidController(identifier, registryContract)
      const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number
      await stopMining(web3Provider)
      const tx1 = ethrDid.setAttribute(stringToBytes32('did/svc/TestService'), 'https://test.uport.me', 86406, {
        from: address,
      })
      const tx2 = ethrDid.setAttribute(stringToBytes32('did/svc/TestService'), 'https://test.uport.me', 86407, {
        from: address,
      })
      await sleep(1000)
      await startMining(web3Provider)
      await tx1
      await tx2

      const result = await didResolver.resolve(identifier)
      expect(result).toEqual({
        didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 1}`, updated: expect.anything() },
        didResolutionMetadata: expect.anything(),
        didDocument: {
          '@context': expect.anything(),
          id: identifier,
          verificationMethod: expect.anything(),
          authentication: expect.anything(),
          assertionMethod: expect.anything(),
          service: [
            {
              id: `${identifier}#service-2`,
              type: 'TestService',
              serviceEndpoint: 'https://test.uport.me',
            },
          ],
        },
      })
    })

    it('adding 2 services in 2 consecutive blocks should result in only 2 services appearing in the DID doc (no duplication)', async () => {
      expect.assertions(2)
      const address = accounts[13]
      const identifier = `did:ethr:dev:${address}`

      const ethrDid = new VdaDidController(identifier, registryContract)

      const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number

      // await stopMining(web3Provider)
      await ethrDid.setAttribute(stringToBytes32('did/svc/TestService1'), 'https://test1.uport.me', 86406, {
        from: address,
      })
      // await startMining(web3Provider)
      let result = await didResolver.resolve(identifier)
      expect(result.didDocumentMetadata.versionId).toEqual(`${blockHeightBeforeChange + 1}`)
      // await stopMining(web3Provider)
      await ethrDid.setAttribute(stringToBytes32('did/svc/TestService2'), 'https://test2.uport.me', 86407, {
        from: address,
      })
      // await startMining(web3Provider)

      result = await didResolver.resolve(identifier)
      expect(result).toEqual({
        didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 2}`, updated: expect.anything() },
        didResolutionMetadata: expect.anything(),
        didDocument: {
          '@context': expect.anything(),
          id: identifier,
          verificationMethod: [expect.anything()],
          authentication: [expect.anything()],
          assertionMethod: [expect.anything()],
          service: [
            {
              id: `${identifier}#service-1`,
              type: 'TestService1',
              serviceEndpoint: 'https://test1.uport.me',
            },
            {
              id: `${identifier}#service-2`,
              type: 'TestService2',
              serviceEndpoint: 'https://test2.uport.me',
            },
          ],
        },
      })
    })

    it('adding and removing a service in the same block should result in no change to the doc (correct order, same block)', async () => {
      expect.assertions(2)
      const address = accounts[14]
      const identifier = `did:ethr:dev:${address}`

      const ethrDid = new VdaDidController(identifier, registryContract)

      const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number

      await stopMining(web3Provider)
      const tx1 = ethrDid.setAttribute(stringToBytes32('did/svc/TestService1'), 'https://test1.uport.me', 86406, {
        from: address,
      })
      let result = await didResolver.resolve(identifier)
      expect(result.didDocumentMetadata.versionId).not.toBeDefined()
      const tx2 = ethrDid.revokeAttribute(stringToBytes32('did/svc/TestService1'), 'https://test1.uport.me', {
        from: address,
      })
      await sleep(1000).then(() => startMining(web3Provider))
      await tx1
      await tx2

      result = await didResolver.resolve(identifier)
      expect(result).toEqual({
        didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 1}`, updated: expect.anything() },
        didResolutionMetadata: expect.anything(),
        didDocument: {
          '@context': expect.anything(),
          id: identifier,
          verificationMethod: [expect.anything()],
          authentication: [expect.anything()],
          assertionMethod: [expect.anything()],
          service: undefined,
        },
      })
    })

    it('adding and removing a service in 2 consecutive blocks should result in no change to the doc (correct order 2 blocks).', async () => {
      expect.assertions(2)
      const address = accounts[15]
      const identifier = `did:ethr:dev:${address}`

      const ethrDid = new VdaDidController(identifier, registryContract)

      const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number

      await ethrDid.setAttribute(stringToBytes32('did/svc/TestService1'), 'https://test1.uport.me', 86406, {
        from: address,
      })
      let result = await didResolver.resolve(identifier)
      expect(result.didDocumentMetadata.versionId).toEqual(`${blockHeightBeforeChange + 1}`)
      await ethrDid.revokeAttribute(stringToBytes32('did/svc/TestService1'), 'https://test1.uport.me', {
        from: address,
      })

      result = await didResolver.resolve(identifier)
      expect(result).toEqual({
        didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 2}`, updated: expect.anything() },
        didResolutionMetadata: expect.anything(),
        didDocument: {
          '@context': expect.anything(),
          id: identifier,
          verificationMethod: [expect.anything()],
          authentication: [expect.anything()],
          assertionMethod: [expect.anything()],
          service: undefined,
        },
      })
    })

    it('removing a service and then adding it back in the next block should keep the service visible in the resolved doc (correct order 2 blocks, corner case)', async () => {
      expect.assertions(2)
      const address = accounts[16]
      const identifier = `did:ethr:dev:${address}`

      const ethrDid = new VdaDidController(identifier, registryContract)

      const blockHeightBeforeChange = (await web3Provider.getBlock('latest')).number

      await ethrDid.revokeAttribute(stringToBytes32('did/svc/TestService1'), 'https://test1.uport.me', {
        from: address,
      })
      let result = await didResolver.resolve(identifier)
      expect(result.didDocumentMetadata.versionId).toEqual(`${blockHeightBeforeChange + 1}`)
      await ethrDid.setAttribute(stringToBytes32('did/svc/TestService1'), 'https://test1.uport.me', 86406, {
        from: address,
      })

      result = await didResolver.resolve(identifier)
      expect(result).toEqual({
        didDocumentMetadata: { versionId: `${blockHeightBeforeChange + 2}`, updated: expect.anything() },
        didResolutionMetadata: expect.anything(),
        didDocument: {
          '@context': expect.anything(),
          id: identifier,
          verificationMethod: [expect.anything()],
          authentication: [expect.anything()],
          assertionMethod: [expect.anything()],
          service: [
            {
              id: `${identifier}#service-2`,
              type: 'TestService1',
              serviceEndpoint: 'https://test1.uport.me',
            },
          ],
        },
      })
    })
  })
})
