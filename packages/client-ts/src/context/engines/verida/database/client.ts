import Axios from "axios";
import { VeridaDatabaseAuthContext } from "@verida/account";
import { ServiceEndpoint } from 'did-resolver'
import { EndpointUsage } from '../../../interfaces'

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

  private authContext?: VeridaDatabaseAuthContext
  private storageContext: string;
  private serviceEndpoint: ServiceEndpoint;

  constructor(storageContext: string, serviceEndpoint: ServiceEndpoint, authContext?: VeridaDatabaseAuthContext) {
    this.authContext = authContext
    this.storageContext = storageContext;
    this.serviceEndpoint = serviceEndpoint
  }

  public async setAuthContext(authContext: VeridaDatabaseAuthContext) {
    this.authContext = authContext
  }

  public async getPublicUser() {
    return this.getAxios().get(this.serviceEndpoint + "auth/public");
  }

  public async createDatabase(
    did: string,
    databaseName: string,
    config: any = {}
  ) {
    return this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/createDatabase", {
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
    return this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/updateDatabase", {
      did: did,
      databaseName: databaseName,
      options: config,
    });
  }

  public async getUsage(): Promise<EndpointUsage> {
    return <EndpointUsage> await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/usage");
  }

  public async getDatabases() {
    return this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/databases");
  }

  public async getDatabaseInfo(databaseName: string) {
    return this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/databaseInfo", {
      databaseName
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
