import Axios from "axios";
import AutoAccount from "../auto";
import { Interfaces } from '@verida/storage-link'
import { Account, VeridaDatabaseAuthContext, AuthType, AuthTypeConfig, VeridaDatabaseAuthTypeConfig } from "@verida/account";

export default class VeridaDatabaseAuthType extends AuthType {

  protected contextAuth?: VeridaDatabaseAuthContext
  protected account: AutoAccount

  public constructor(account: Account, contextName: string, serviceEndpoint: Interfaces.SecureContextEndpoint, signKey: Interfaces.SecureContextPublicKey) {
    super(account, contextName, serviceEndpoint, signKey)
    this.account = <AutoAccount> account
  }

  public async getAuthContext(config?: VeridaDatabaseAuthTypeConfig): Promise<VeridaDatabaseAuthContext> {
    const serverUrl = config && config.endpointUri ? config.endpointUri : this.serviceEndpoint.endpointUri
    const deviceId = config && config.deviceId ? config.deviceId : "Test Device"

    let forceAccessToken = false

    if (config) {
      forceAccessToken = config.forceAccessToken ? config.forceAccessToken : true
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
      //console.log('getContextAuth(): no refreshtoken, generating')
      // @todo: get a new refresh token if getting close to expiring?

      let authJwt
      try {
        // Generate an auth token to start auth process
        const authJwtResponse = await this.getAxios(this.contextName).post(serverUrl + "auth/generateAuthJwt",{
          did,
          contextName: this.contextName
        })

        authJwt = authJwtResponse.data.authJwt
      } catch (err: any) {
        throw new Error(`Unable to connect to storage node (${serverUrl}): ${err.message}`)
      }

      let refreshResponse
      try {
        // Generate a refresh token by authenticating
        const consentMessage = `Authenticate this application context: "${this.contextName}"?\n\n${did.toLowerCase()}\n${authJwt.authRequestId}`
        const signature = await this.account.sign(consentMessage)

        refreshResponse = await this.getAxios(this.contextName).post(serverUrl + "auth/authenticate",{
          authJwt: authJwt.authJwt,
          did,
          contextName: this.contextName,
          signature,
          deviceId: deviceId
        });

        //console.log('refresh response', refreshResponse.data)
      } catch (err: any) {
        throw new Error(`Unable to authenticate with storage node (${serverUrl}): ${err.message}`)
      }

      //console.log("authenticate response", refreshResponse.data)

      const refreshToken = refreshResponse.data.refreshToken
      const host = refreshResponse.data.host
      const accessToken = refreshResponse.data.accessToken

      this.contextAuth = {
        refreshToken,
        accessToken,
        host,
        publicSigningKey: this.signKey
      }

      //console.log(this.contextAuth!)

      return this.contextAuth!
    }

    // No access token, but have a refresh token, so generate access token
    if (this.contextAuth && !this.contextAuth.accessToken) {
      //console.log('getContextAuth(): no access token, but refresh token, so generating access token')

      const accessResponse = await this.getAxios(this.contextName).post(serverUrl + "auth/connect",{
        refreshToken: this.contextAuth.refreshToken,
        did,
        contextName: this.contextName
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

  public async disconnectDevice(deviceId: string): Promise<boolean> {
    const contextAuth = await this.getAuthContext()

    const did = await this.account.did();

    const consentMessage = `Invalidate device for this application context: "${this.contextName}"?\n\n${did.toLowerCase()}\n${deviceId}`
    const signature = await this.account.sign(consentMessage)
    
    try {
      const response = await this.getAxios(this.contextName).post(`${contextAuth.host}auth/invalidateDeviceId`, {
          did,
          contextName: this.contextName,
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

  private getAxios(storageContext: string, accessToken?: string) {
    let config: any = {
      headers: {
        // @todo: Application-Name needs to become Storage-Context
        "Application-Name": storageContext,
      },
    };

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`
    }

    return Axios.create(config);
  }

}