import Client from "./client";
import Context from "./context/context";
import { NetworkConnectionConfig } from "./interfaces";

<<<<<<< HEAD
=======
/**
 * @category
 * Modules
 */
>>>>>>> 2d79d5c946e4a5c11f6b3c13f8c8f430a2aa7eac
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
      return context;
    } catch (err) {
      // User may have cancelled the login attempt
      return;
    }
  }
}

export default Network;
