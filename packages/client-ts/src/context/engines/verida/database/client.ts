import Axios from "axios";
import { Account } from "@verida/account";

/**
 * Interface for RemoteClientAuthentication
 */
interface RemoteClientAuthentication {
  refreshToken: string;
  accessToken: string;
  host: string;
}

export interface CouchDbAuthentication {
  host: string;   // host name
  token: string;  // access token
  //username: string; // is this needed?
}

/**
 * @category
 * Modules
 */
export class DatastoreServerClient {
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
    let did = await account.did();
    did = did.toLowerCase()

    /*
    const signature = await account.sign(`Do you wish to authenticate this storage context: "${this.storageContext}"?\n\n${did}`)

    this.authentication = {
      username: did,
      signature: signature
    };*/
  }

  public async getUser(did: string): Promise<CouchDbAuthentication> {
    if (this.authentication) {
      return <CouchDbAuthentication> {
        host: this.authentication.host,
        token: this.authentication.accessToken
      }
    }

    if (!this.account) {
      throw new Error("Unable to connect. No account set.")
    }

    const contextAuth = await this.account!.getContextAuth(this.storageContext)

    if (!contextAuth) {
      throw new Error("Unable to connect. Unable to authenticate.")
    }

    // @todo: test if connection is valid?
    // @todo: get a new access token if invalid
    // @todo: get a new refresh token if getting close to expiring, save to cache (account.updateContextAuth()?)
    // @todo: how are invalid access tokens going to produce an error? how to catch and then regenerate?
    //  - expired token stored in session when loading the app
    //  - token expires while using the app

    let response
    try {
      response = await this.getAxios(true).get(this.serverUrl + "auth/connect?did=" + did);
    } catch (err: any) {
      if (
        err.response &&
        err.response.data.data &&
        err.response.data.data.did == "Invalid DID specified"
      ) {
        // User doesn't exist, so create on this endpointUri server
        response = await this.createUser();
      } else if (err.response && err.response.statusText == "Unauthorized") {
        throw new Error("Invalid signature or permission to access DID server");
      } else {
        // Unknown error
        throw err;
      }
    }

    return response.data.user
  }

  private async authenticate() {
    // throw error if no account

  }

  public async getPublicUser() {
    return this.getAxios(false).get(this.serverUrl + "user/public");
  }

  public async createUser() {
    throw new Error('create user is no longer supported due to refresh token refactor')
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
