import { InfuraProvider, JsonRpcProvider } from "@ethersproject/providers";
import { configureResolverWithNetworks } from "../configuration";

describe("configuration", () => {
  it("works with named network", async () => {
    const contracts = configureResolverWithNetworks({
      networks: [
        {
          name: "testnet",
          provider: new JsonRpcProvider(
            "https://matic-mumbai.chainstacklabs.com"
          ),
        },
      ],
    });
    expect(contracts["testnet"]).toBeDefined();
    expect(contracts["0x13881"]).toBeDefined();
  });

  it("works with single network", async () => {
    const contracts = configureResolverWithNetworks({
      name: "testnet",
      provider: new JsonRpcProvider("https://matic-mumbai.chainstacklabs.com"),
    });
    expect(contracts["testnet"]).toBeDefined();
    expect(contracts["0x13881"]).toBeDefined();
  });

  /*
  it('works with single provider', async () => {
    const contracts = configureResolverWithNetworks({
      provider: new JsonRpcProvider('https://matic-mumbai.chainstacklabs.com'),
    })
    expect(contracts['']).toBeDefined()
  })

  it('works with only rpcUrl', async () => {
    const contracts = configureResolverWithNetworks({
      rpcUrl: 'https://matic-mumbai.chainstacklabs.com',
    })
    expect(contracts['']).toBeDefined()
  })

  it('works with rpc and numbered chainId', async () => {
    const contracts = configureResolverWithNetworks({
      rpcUrl: 'https://matic-mumbai.chainstacklabs.com',
      chainId: 80001,
    })
    expect(contracts['0x13881']).toBeDefined()
  })*/

  it("throws when no configuration is provided", () => {
    expect(() => {
      configureResolverWithNetworks();
    }).toThrowError(
      "invalid_config: Please make sure to have at least one network"
    );
  });

  it("throws when no relevant configuration is provided for a network", () => {
    expect(() => {
      configureResolverWithNetworks({ networks: [{ chainId: "0xbad" }] });
    }).toThrowError(
      "invalid_config: No web3 provider could be determined for network"
    );
  });

  it("throws when malformed configuration is provided for a network", () => {
    expect(() => {
      configureResolverWithNetworks({ networks: [{ web3: "0xbad" }] });
    }).toThrowError(
      "invalid_config: No web3 provider could be determined for network"
    );
  });
});
