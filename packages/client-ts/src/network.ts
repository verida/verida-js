import { BlockchainAnchor, ClientConfig, NetworkConnectionConfig, Network as VeridaNetwork } from "@verida/types";
import { Context } from ".";
import Client from "./client";
import { decodeUri, fetchVeridaUri, explodeVeridaUri } from '@verida/helpers'

/**
 * @category
 * Modules
 */
class Network {

  protected rpcUrls: Record<string, string> = {}

  public setRpcUrls(rpcUrls: Record<string, string>) {
    this.rpcUrls = rpcUrls
  }

  /**
   * Opens a new application context to provide encrypted storage and messaging to an application.
   *
   * This is a quicker alternative to generating a `client` connection to the Verida network
   * and then opening a context.
   *
   * @param config NetworkConnectionConfig Configuration
   * @returns {Context | undefined} If the user logs in a valid `Context` object is returned. If an unexpected error occurs or the user cancels the login attempt then nothing is returned.
   */
  public async connect(
    config: NetworkConnectionConfig
  ): Promise<Context | undefined> {
    const client = new Client(config.client ? config.client : {});
    await client.connect(config.account);

    try {
      const context = await client.openContext(
        config.context.name,
        config.context.forceCreate
      );
      return <Context> context;
    } catch (err) {
      // User may have cancelled the login attempt
      return;
    }
  }

  public async getRecord(veridaUri: string, encoded: boolean = false) {
    if (encoded) {
      veridaUri = decodeUri(veridaUri)
    }

    const urlParts = explodeVeridaUri(veridaUri)
    const clientConfig: ClientConfig = {
      network: urlParts.network
    }

    // Set custom RPC URL if required
    for (const blockchain of Object.keys(this.rpcUrls)) {
      if (urlParts.did.match(blockchain)) {
        clientConfig.didClientConfig = {
          rpcUrl: this.rpcUrls[blockchain],
          blockchain: <BlockchainAnchor> blockchain
        }
        break
      }
    }

    const client = new Client(clientConfig)
    const record = await fetchVeridaUri(veridaUri, client)
    return record
  }
}

export default new Network()
