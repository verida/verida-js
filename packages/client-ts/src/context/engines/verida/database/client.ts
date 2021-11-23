import Axios from "axios";
import { Account } from "@verida/account";

/**
 * Interface for RemoteClientAuthentication
 */
interface RemoteClientAuthentication {
  username: string;
  signature: string;
}

/**
 * @category
 * Modules
 */
class DatastoreServerClient {
  private serverUrl: string;

  private storageContext: string;
  private authentication?: RemoteClientAuthentication;
  private account?: Account;

  constructor(storageContext: string, serverUrl: string) {
    this.storageContext = storageContext;
    this.serverUrl = serverUrl;
  }

  public async setAccount(account: Account) {
    this.account = account;
    const did = await account.did();
    const keyring = await account.keyring(this.storageContext);

    this.authentication = {
      username: did.toLowerCase(),
      signature: keyring.getSeed(),
    };
  }

  public async getUser(did: string) {
    return this.getAxios(true).get(this.serverUrl + "user/get?did=" + did);
  }

  public async getPublicUser() {
    return this.getAxios(false).get(this.serverUrl + "user/public");
  }

  public async createUser() {
    if (!this.account) {
      throw new Error(
        "Unable to create storage account. No Verida account connected."
      );
    }

    const did = await this.account!.did();
    return this.getAxios(true).post(this.serverUrl + "user/create", {
      did: did,
    });
  }

  public async createDatabase(
    did: string,
    databaseName: string,
    config: any = {}
  ) {
    return this.getAxios(true).post(this.serverUrl + "user/createDatabase", {
      did: did,
      databaseName: databaseName,
      options: config,
    });
  }

  public async updateDatabase(
    did: string,
    databaseName: string,
    config: any = {}
  ) {
    return this.getAxios(true).post(this.serverUrl + "user/updateDatabase", {
      did: did,
      databaseName: databaseName,
      options: config,
    });
  }

  private getAxios(includeAuth: boolean) {
    let config: any = {
      headers: {
        // @todo: Application-Name needs to become Storage-Context
        "Application-Name": this.storageContext,
      },
    };

    if (includeAuth) {
      if (!this.authentication) {
        throw new Error(
          "Unable to authenticate as there is no authentication defined"
        );
      }

      config["auth"] = {
        username: this.authentication.username.replace(/:/g, "_"),
        password: this.authentication.signature,
      };
    }

    return Axios.create(config);
  }
}

export default DatastoreServerClient;
