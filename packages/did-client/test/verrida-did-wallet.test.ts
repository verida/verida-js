import { expect } from 'chai'
import { VeridaDidWallet } from '../src/verida-did-wallet'
import { BlockchainAnchor } from '@verida/types'
import { Wallet } from 'ethers'

describe('VeridaDidWallet', () => {
  describe('createRandom()', () => {
    it('should create a new random wallet', () => {
      const veridaDidWallet = VeridaDidWallet.createRandom(BlockchainAnchor.POLAMOY)

      expect(veridaDidWallet.did).to.be.a('string')
      expect(veridaDidWallet.did).to.include('did:vda:polamoy:')
      expect(veridaDidWallet.blockchainAnchor).to.equal(BlockchainAnchor.POLAMOY)
      expect(veridaDidWallet.address).to.match(/^0x[a-fA-F0-9]{40}$/)
      expect(veridaDidWallet.privateKey).to.match(/^0x[a-fA-F0-9]{64}$/)
      expect(veridaDidWallet.publicKey).to.equal(veridaDidWallet.address)
      expect(veridaDidWallet.signer).to.not.be.undefined
    })
  })

  describe('fromSigner()', () => {
    it('should create a wallet from an existing signer', async () => {
      const signer = Wallet.createRandom()
      const veridaDidWallet = await VeridaDidWallet.fromSigner(signer, BlockchainAnchor.POLAMOY)

      expect(veridaDidWallet.did).to.be.a('string')
      expect(veridaDidWallet.did).to.include('did:vda:polamoy:')
      expect(veridaDidWallet.blockchainAnchor).to.equal(BlockchainAnchor.POLAMOY)
      expect(veridaDidWallet.address).to.equal(signer.address)
      expect(veridaDidWallet.publicKey).to.equal(veridaDidWallet.address)
      expect(veridaDidWallet.privateKey).to.be.undefined
      expect(veridaDidWallet.signer).to.equal(signer)
    })
  })

  describe('fromPrivateKeyOrMnemonic()', () => {
    it('should create a wallet from a private key', () => {
      const originalWallet = Wallet.createRandom()
      const veridaDidWallet = VeridaDidWallet.fromPrivateKeyOrMnemonic(originalWallet.privateKey, BlockchainAnchor.POLAMOY)

      expect(veridaDidWallet.did).to.be.a('string')
      expect(veridaDidWallet.did).to.include('did:vda:polamoy:')
      expect(veridaDidWallet.blockchainAnchor).to.equal(BlockchainAnchor.POLAMOY)
      expect(veridaDidWallet.address).to.equal(originalWallet.address)
      expect(veridaDidWallet.privateKey).to.equal(originalWallet.privateKey)
      expect(veridaDidWallet.publicKey).to.equal(veridaDidWallet.address)
      expect(veridaDidWallet.signer).to.not.be.undefined
    })

    it('should create a wallet from a mnemonic', () => {
      const originalWallet = Wallet.createRandom()
      const veridaDidWallet = VeridaDidWallet.fromPrivateKeyOrMnemonic(originalWallet.mnemonic.phrase, BlockchainAnchor.POLAMOY)

      expect(veridaDidWallet.did).to.be.a('string')
      expect(veridaDidWallet.did).to.include('did:vda:polamoy:')
      expect(veridaDidWallet.blockchainAnchor).to.equal(BlockchainAnchor.POLAMOY)
      expect(veridaDidWallet.address).to.equal(originalWallet.address)
      expect(veridaDidWallet.privateKey).to.equal(originalWallet.privateKey)
      expect(veridaDidWallet.publicKey).to.equal(veridaDidWallet.address)
      expect(veridaDidWallet.signer).to.not.be.undefined
    })
  })

    describe('Key encodings', () => {
        let wallet: VeridaDidWallet

        beforeEach(() => {
            wallet = VeridaDidWallet.createRandom(BlockchainAnchor.POLAMOY)
        })

        it('should provide public key as buffer', () => {
            expect(wallet.publicKeyBuffer).to.be.instanceof(Uint8Array)
            expect(wallet.publicKeyBuffer.length).to.equal(20) // 20 bytes for address
        })

        it('should provide public key in base58', () => {
            expect(wallet.publicKeyBase58).to.be.a('string')
        })

        it('should provide private key as buffer', () => {
            expect(wallet.privateKeyBuffer).to.be.instanceof(Uint8Array)
            expect(wallet.privateKeyBuffer!.length).to.equal(32) // 32 bytes for private key
        })

        it('should provide private key in base58', () => {
            expect(wallet.privateKeyBase58).to.be.a('string')
        })

        it('should handle undefined private key for signer-based wallets', async () => {
            const signerWallet = await VeridaDidWallet.fromSigner(Wallet.createRandom(), BlockchainAnchor.POLAMOY)
            expect(signerWallet.privateKeyBuffer).to.be.undefined
            expect(signerWallet.privateKeyBase58).to.be.undefined
        })
    })
})
