
# DID Document

This library handles the creation and update of DID documents meeting the [W3C DID Document specification](https://www.w3.org/TR/did-core/).

It has additional helper methods:

- `addContext()`: Manage information about a Verida context to a document. This adds relevant service endpoints and public keys.
- `removeContext()`:
- `addContextService()`: 
- `addContextSignKey()`:
- `addContextAsymKey()`:
- `signProof()`:
- `verifyProof()`:
- `verifySig()`:
- `verifyContextSignature()`:
- `locateServiceEndpoint()`:


## Example DID Document

```
{
  "_id": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289",
  "_rev": "1-f7161a44c70c2f56bcd6556be71d3775",
  "doc": {
    "id": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289",
    "controller": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289",
    "assertionMethod": [
      "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289",
      "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289?context=0xa8b06901f1ed1ccefd33164727d07b2778445c7f491746527cc8d9a47c102b14#sign"
    ],
    "verificationMethod": [
      {
        "id": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289",
        "type": "EcdsaSecp256k1VerificationKey2019",
        "controller": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289",
        "publicKeyHex": "0x04d0843b161fbeb68af22bef5f93acd375ce9c80135c2589b87bca6e88b5aff4e5bb50d3d2177d3f9fefe67f42abbe1fa25f131b65ea6e849df4c14438fe5959fe"
      },
      {
        "id": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289?context=0xa8b06901f1ed1ccefd33164727d07b2778445c7f491746527cc8d9a47c102b14#sign",
        "type": "EcdsaSecp256k1VerificationKey2019",
        "controller": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289",
        "publicKeyHex": "0x034d51203e92581a65f6625da3ebe1ff7952f190bed8365419bda068c9525a2d1a"
      },
      {
        "id": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289?context=0xa8b06901f1ed1ccefd33164727d07b2778445c7f491746527cc8d9a47c102b14#asym",
        "type": "Curve25519EncryptionPublicKey",
        "controller": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289",
        "publicKeyHex": "0xfcd0a3c0e7fa0588670309e2bbce93dbeae0c272dfe695ae2bfaaa2de7d6452a"
      }
    ],
    "service": [
      {
        "id": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289?context=0xa8b06901f1ed1ccefd33164727d07b2778445c7f491746527cc8d9a47c102b14#database",
        "type": "VeridaDatabase",
        "serviceEndpoint": "https://db.testnet.verida.io:5002/"
      },
      {
        "id": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289?context=0xa8b06901f1ed1ccefd33164727d07b2778445c7f491746527cc8d9a47c102b14#messaging",
        "type": "VeridaMessage",
        "serviceEndpoint": "https://db.testnet.verida.io:5002/"
      }
    ],
    "keyAgreement": [
      "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289?context=0xa8b06901f1ed1ccefd33164727d07b2778445c7f491746527cc8d9a47c102b14#asym"
    ],
    "proof": {
      "type": "EcdsaSecp256k1VerificationKey2019",
      "verificationMethod": "did:vda:0x0159c90eceecfeec7b92936f5249e17969d18289",
      "proofPurpose": "assertionMethod",
      "proofValue": "0x972664a19cff034db53f4958ae36b72679c25f69267fc1ffe2b57f9fdc7b68137c972f67e2947ea7ebbc8ec316201f7c41d53ec96e3a40418da1d30f909b71b01b"
    }
  }
}
```