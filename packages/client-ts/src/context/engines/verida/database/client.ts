import Axios from "axios";
import { Account, VeridaDatabaseAuthContext } from "@verida/account";

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
  private signKey: string

  constructor(storageContext: string, serverUrl: string, signKey: string, deviceId: string="Test device") {
    this.storageContext = storageContext;
    this.serverUrl = serverUrl;
    this.signKey = signKey
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

    const authContext = <VeridaDatabaseAuthContext> await this.account.getAuthContext(this.storageContext, {
      serverUrl: this.serverUrl,
      deviceId: this.deviceId,
      publicSigningKey: this.signKey,
      forceAccessToken
    })

    return authContext
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

  public async disconnectDevice(deviceId: string): Promise<boolean> {
    if (!this.account) {
      throw new Error("Unable to disconnect device. No account connected.")
    }

    const did = await this.account.did();

    const consentMessage = `Invalidate device for this application context: "${this.storageContext}"?\n\n${did.toLowerCase()}\n${deviceId}`
    const signature = await this.account.sign(consentMessage)
    
    try {
      const response = await this.getAxios().post(`${this.serverUrl}auth/invalidateDeviceId`, {
          did,
          contextName: this.storageContext,
          deviceId: deviceId,
          signature
      });

      return response.data.status == 'success'
    } catch (err: any) {
      if (err.response && err.response.data) {
        throw new Error(`Unable to disconnect device: ${JSON.stringify(err.response.data.data)}`)
      }
      else {
        throw new Error(`Unable to disconnect device: ${err.message}`)
      }
    }
  }
}

export default DatastoreServerClient;
