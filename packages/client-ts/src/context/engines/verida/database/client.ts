import Axios from "axios";
import { Account } from "@verida/account";

/**
 * Interface for RemoteClientAuthentication
 */
export interface ContextAuth {
  refreshToken: string;
  accessToken: string;
  host: string;
}

/**
 * @category
 * Modules
 */
export class DatastoreServerClient {
  private serverUrl: string;

  private storageContext: string;
  private contextAuth?: ContextAuth;
  private account?: Account;
  private deviceId: string

  constructor(storageContext: string, serverUrl: string, deviceId: string="Test device") {
    this.storageContext = storageContext;
    this.serverUrl = serverUrl;
    this.deviceId = deviceId;
  }

  public async setAccount(account: Account) {
    this.account = account;
    let did = await account.did();
    did = did.toLowerCase()
  }

  public async getContextAuth(forceAccessToken=false): Promise<ContextAuth> {
    if (!this.account) {
      throw new Error("Unable to connect. No account set.")
    }

    // @todo: how are invalid access tokens going to produce an error? how to catch and then regenerate?
    //  - expired token stored in session when loading the app
    //  - token expires while using the app

    // -------------------------

    // We already have a context auth object, so reuse it unless
    // requested to force create access token.
    // This can happen if the access token has expired when being
    // used and it can automatically be re-requested.
    if (this.contextAuth && !forceAccessToken) {
      return this.contextAuth
    }

    const did = await this.account!.did()

    // No context auth or no refresh token, so generate it by signing a consent message
    if (!this.contextAuth || !this.contextAuth.refreshToken) {
      // @todo: get a new refresh token if getting close to expiring?

      let authJwt
      try {
        // Generate an auth token to start auth process
        const authJwtResponse = await this.getAxios().post(this.serverUrl + "auth/generateAuthJwt",{
          did,
          contextName: this.storageContext
        });

        // @todo: handle connection error

        //console.log("generateAuthJwt response", authJwtResponse.data)
        authJwt = authJwtResponse.data.authJwt
      } catch (err: any) {
        throw new Error(`Context Authentication Error. ${err.message}`)
      }

      let refreshResponse
      try {
        // Generate a refresh token by authenticating
        const consentMessage = `Authenticate this application context: "${this.storageContext}"?\n\n${did.toLowerCase()}\n${authJwt.authRequestId}`
        const signature = await this.account!.sign(consentMessage)

        refreshResponse = await this.getAxios().post(this.serverUrl + "auth/authenticate",{
          authJwt: authJwt.authJwt,
          did,
          contextName: this.storageContext,
          signature,
          deviceId: this.deviceId
        });

        // @todo: handle auth error (refreshResponse.data.status != 'success')
      } catch (err: any) {
        // @todo: handle connection error
        console.log(err)
        throw new Error(`Context Authentication Error. ${err.message}`)
      }

      //console.log("authenticate response", refreshResponse.data)

      const refreshToken = refreshResponse.data.refreshToken
      const host = refreshResponse.data.host
      const accessToken = refreshResponse.data.accessToken

      this.contextAuth = {
        refreshToken,
        accessToken,
        host
      }

      //console.log(this.contextAuth!)

      return this.contextAuth
    }

    // No access token, but have a refresh token, so generate access token
    if (this.contextAuth && !this.contextAuth.accessToken) {
      const accessResponse = await this.getAxios().post(this.serverUrl + "auth/connect",{
        refreshToken: this.contextAuth.refreshToken,
        did,
        contextName: this.storageContext
      });

      // @todo: handle connect error
      // @todo: handle connect error (accessResponse.data.status != 'success')

      //console.log("connect response", accessResponse.data)

      const accessToken = accessResponse.data.accessToken
      this.contextAuth.accessToken = accessToken
      return this.contextAuth
    }

    // @todo: test if connection is valid?

    return this.contextAuth!
  }

  public async getPublicUser() {
    return this.getAxios().get(this.serverUrl + "auth/public");
  }

  public async createDatabase(
    did: string,
    databaseName: string,
    config: any = {}
  ) {
    const contextAuth = await this.getContextAuth()

    return this.getAxios(contextAuth.accessToken).post(this.serverUrl + "user/createDatabase", {
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
    const contextAuth = await this.getContextAuth()

    return this.getAxios(contextAuth.accessToken).post(this.serverUrl + "user/updateDatabase", {
      did: did,
      databaseName: databaseName,
      options: config,
    });
  }

  private getAxios(accessToken?: string) {
    let config: any = {
      headers: {
        // @todo: Application-Name needs to become Storage-Context
        "Application-Name": this.storageContext,
      },
    };

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`
    }

    return Axios.create(config);
  }
}

export default DatastoreServerClient;
