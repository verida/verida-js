import { Wallet } from 'ethers';
import {lookup} from '../src/lookup';
import {expect} from 'chai';

const did = {
    address: "0x8Ec5df9Ebc9554CECaA1067F974bD34735d3e539",
    privateKey: "0x42d4c8a6b73fe84863c6f6b5a55980f9a8949e18ed20da65ca2033477ad563f0",
    publicKey: "0x042b816206dfd7c694d627ff775b9c151319b9a0e54de94d18e61619372fc713664dc677d5247adc2d4f8722b227bd9504b741ea380d5e7887a5698a7a634ec6ae",
}

const rpcUrl = "https://rpc-mumbai.maticvigil.com";

describe('Lookup test', () => {
    it('Failed : Unregistered DID address', async () => {
        const tempDid = Wallet.createRandom();
        const result = await lookup(tempDid.address, rpcUrl);
        
        expect(result.success).to.be.equal(false, 'Unregistered DID address');
    });

    it('Success', async () => {
        const result = await lookup(did.address, rpcUrl);

        expect(result.success).to.be.equal(true, 'Success');
    });
})