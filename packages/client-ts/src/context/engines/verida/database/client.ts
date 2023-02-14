import { EndpointUsage, VeridaDatabaseAuthContext } from "@verida/types";
import Axios from "axios";
import { ServiceEndpoint } from 'did-resolver'

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

  public async getStatus() {
    return this.getAxios().get(this.serviceEndpoint + "status");
  }

  public async createDatabase(
    databaseName: string,
    config: any = {}
  ) {
    return this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/createDatabase", {
      databaseName: databaseName,
      options: config,
    });
  }

  public async checkReplication(
    databaseName?: string
  ) {
    const opts: any = {}
    if (databaseName) {
      opts.databaseName = databaseName
    }
    return await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/checkReplication", opts);
  }

  public async updateDatabase(
    databaseName: string,
    config: any = {}
  ) {
    return await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/updateDatabase", {
      databaseName: databaseName,
      options: config,
    });
  }

  public async deleteDatabase(
    databaseName: string
  ) {
    return await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/deleteDatabase", {
      databaseName
    });
  }

  public async pingDatabases(
    databaseHashes: string[],
    isWritePublic: boolean,
    did?: string,
    contextName?: string
  ) {
    try {
      return await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/pingDatabase", {
        databaseHashes,
        isWritePublic,
        did,
        contextName
      });
    } catch(err: any) {
      //console.log(`error with pingDatabase() ${err.response.data.message}`)
      // Ignore errors for now as the endpoint doesn't exist on storage nodes
    }
  }

  public async getUsage(): Promise<EndpointUsage> {
    const result = await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/usage");

    if (result.data.status !== 'success') {
      throw new Error(`${this.serviceEndpoint}: Unable to get usage info (${result.data.message})`)
    }

    return <EndpointUsage> result.data.result
  }

  public async getDatabases() {
    const result = await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/databases");

    if (result.data.status !== 'success') {
      throw new Error(`${this.serviceEndpoint}: Unable to get database list (${result.data.message})`)
    }

    return result.data.result

    return 
  }

  public async getDatabaseInfo(databaseName: string) {
    const result: any = await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/databaseInfo", {
      databaseName
    });

    if (result.data.status !== 'success') {
      throw new Error(`${this.serviceEndpoint}: Unable to get database info (${result.data.message})`)
    }

    return result.data.result
  }

  private getAxios(accessToken?: string) {
    let config: any = {
      headers: {
        // @todo: Application-Name needs to become Storage-Context
        "Application-Name": this.storageContext,
      },
      timeout: 5000,
    };

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`
    }

    return Axios.create(config);
  }

}

export default DatastoreServerClient;
