import { EndpointUsage, VeridaDatabaseAuthContext } from "@verida/types";
import Axios from "axios";
import { ServiceEndpoint } from 'did-resolver'
import Endpoint from "./endpoint";

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

  private endpoint: Endpoint
  private authContext?: VeridaDatabaseAuthContext
  private storageContext: string;
  private serviceEndpoint: ServiceEndpoint;

  constructor(endpoint: Endpoint, storageContext: string, serviceEndpoint: ServiceEndpoint, authContext?: VeridaDatabaseAuthContext) {
    this.endpoint = endpoint
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

  /**
   * 
   * @param databaseName 
   * @param config 
   * @param retry Retry if an authentication error occurs
   * @returns 
   */
  public async createDatabase(
    databaseName: string,
    config: any = {},
    retry: boolean
  ): Promise<any> {
    try {
      return await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/createDatabase", {
        databaseName: databaseName,
        options: config,
      });
    } catch (err: any) {
      if (err.response && err.response.status == 401 && retry) {
        await this.reAuth()
        return this.createDatabase(databaseName, config, false)
      }

      throw err
    }
  }

  public async checkReplication(
    databaseName?: string,
    retry: boolean = true
  ): Promise<any> {
    //console.log(`checkReplication(${databaseName} / ${this.serviceEndpoint})`)
    try {
      const opts: any = {}
      if (databaseName) {
        opts.databaseName = databaseName
      }

      return await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/checkReplication", opts);
    } catch (err: any) {
      if (err.response && err.response.status == 401 && retry) {
        await this.reAuth()
        return this.checkReplication(databaseName, false)
      }

      throw err
    }
  }

  public async updateDatabase(
    databaseName: string,
    config: any = {},
    retry: boolean = true
  ): Promise<any> {
    try {
      return await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/updateDatabase", {
        databaseName: databaseName,
        options: config,
      });
    } catch (err: any) {
      if (err.response && err.response.status == 401 && retry) {
        await this.reAuth()
        return this.updateDatabase(databaseName, config, false)
      }

      throw err
    }
  }

  public async deleteDatabase(
    databaseName: string,
    retry: boolean = true
  ): Promise<any> {
    //console.log(`client.deleteDatabase(${databaseName} / ${this.serviceEndpoint})`)
    try {
      return await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/deleteDatabase", {
        databaseName
      });
    } catch (err: any) {
      if (err.response && err.response.status == 401 && retry) {
        await this.reAuth()
        return this.deleteDatabase(databaseName, false)
      }

      throw err
    }
  }

  public async pingDatabases(
    databaseHashes: string[],
    isWritePublic: boolean,
    did?: string,
    contextName?: string,
    retry: boolean = true
  ): Promise<any> {
    //console.log(`client.pingDatabases(${databaseHashes} / ${this.serviceEndpoint})`)
    try {
      return await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/pingDatabase", {
        databaseHashes,
        isWritePublic,
        did,
        contextName
      });
    } catch(err: any) {
      if (err.response && err.response.status == 401 && retry) {
        await this.reAuth()
        return this.pingDatabases(databaseHashes, isWritePublic, did, contextName, false)
      }
    }
  }

  public async getUsage(retry: boolean): Promise<EndpointUsage> {
    try {
      const result = await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/usage");
      if (result.data.status !== 'success') {
        throw new Error(`${this.serviceEndpoint}: Unable to get usage info (${result.data.message})`)
      }

      return <EndpointUsage> result.data.result
    } catch (err: any) {
      if (err.response && err.response.status == 401 && retry) {
        await this.reAuth()
        return this.getUsage(false)
      }

      throw err
    }
  }

  public async getDatabases(retry: boolean): Promise<void> {
    try {
      const result = await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/databases");

      if (result.data.status !== 'success') {
        throw new Error(`${this.serviceEndpoint}: Unable to get database list (${result.data.message})`)
      }

      return result.data.result
    } catch (err: any) {
      if (err.response && err.response.status == 401 && retry) {
        await this.reAuth()
        return this.getDatabases(false)
      }

      throw err
    }
  }

  public async getDatabaseInfo(databaseName: string, retry: boolean): Promise<any> {
    try {
      const result: any = await this.getAxios(this.authContext!.accessToken).post(this.serviceEndpoint + "user/databaseInfo", {
        databaseName
      });
  
      if (result.data.status !== 'success') {
        throw new Error(`${this.serviceEndpoint}: Unable to get database info (${result.data.message})`)
      }
  
      return result.data.result
    } catch (err: any) {
      if (err.response && err.response.status == 401 && retry) {
        await this.reAuth()
        return this.getDatabaseInfo(databaseName, retry)
      }

      throw err
    }
  }

  private async reAuth() {
    await this.endpoint.authenticate(true)
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
