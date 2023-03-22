import { NetworkConnectionConfig, EnvironmentType } from "@verida/types";
import { Context } from ".";
import Client from "./client";
import { decodeUri, explodeVeridaUri, explodeDID, fetchVeridaUri } from '@verida/helpers'

/**
 * @category
 * Modules
 */
class Network {
  /**
   * Opens a new application context to provide encrypted storage and messaging to an application.
   *
   * This is a quicker alternative to generating a `client` connection to the Verida network
   * and then opening a context.
   *
   * @param config NetworkConnectionConfig Configuration
   * @returns {Context | undefined} If the user logs in a valid `Context` object is returned. If an unexpected error occurs or the user cancels the login attempt then nothing is returned.
   */
  public static async connect(
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

  public static async getRecord(veridaUri: string, encoded: boolean = false) {
    if (encoded) {
      veridaUri = decodeUri(veridaUri)
    }

    const uriParts = explodeVeridaUri(veridaUri)
    const didParts = explodeDID(uriParts.did)
    const environment = didParts.network
    const client = new Client({
      environment: environment == 'testnet' ? EnvironmentType.TESTNET : EnvironmentType.MAINNET,
    })
    const record = await fetchVeridaUri(veridaUri, client)
    return record
  }
}

export default Network;
