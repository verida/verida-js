import { Resolver } from "did-resolver";
import { getResolver } from "../resolver";
import { interpretIdentifier } from "../helpers";

jest.setTimeout(30000);

describe("ethrResolver (alt-chains)", () => {
  const addr = "0xd0dbe9d3698738f899ccd8ee27ff2347a7faa4dd";
  const { address } = interpretIdentifier(addr);
  const checksumAddr = address;

  describe("polygon-networks", () => {
    it("resolves on testnet when configured", async () => {
      const did = "did:vda:testnet:" + addr;
      const vda = getResolver({
        networks: [{ name: "testnet", rpcUrl: "http://44.234.36.28:8545" }],
      });
      const resolver = new Resolver(vda);
      const result = await resolver.resolve(did);
      expect(result).toEqual({
        didDocumentMetadata: {},
        didResolutionMetadata: { contentType: "application/did+ld+json" },
        didDocument: {
          "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld",
          ],
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: "EcdsaSecp256k1RecoveryMethod2020",
              controller: did,
              blockchainAccountId: `@eip155:80001:0xd0Dbe9d3698738F899CcD8ee27fF2347a7FaA4dd`,
            },
          ],
          authentication: [`${did}#controller`],
          assertionMethod: [`${did}#controller`],
        },
      });
    });
  });
});
