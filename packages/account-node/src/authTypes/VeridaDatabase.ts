import Axios from "axios";
import AutoAccount from "../auto";
import { AuthType } from '@verida/account'
import { Account } from "@verida/account";
import { ServiceEndpoint } from 'did-resolver'
import { ContextAuthorizationError, SecureContextPublicKey, VeridaDatabaseAuthContext, VeridaDatabaseAuthTypeConfig } from "@verida/types";

export default class VeridaDatabaseAuthType extends AuthType {

  protected contextAuth?: VeridaDatabaseAuthContext
  protected account: AutoAccount
  // 5 second request timeout
  protected timeout: number = 10000

  public constructor(account: Account, contextName: string, serviceEndpoint: ServiceEndpoint, signKey: SecureContextPublicKey) {
    super(account, contextName, serviceEndpoint, signKey)
    this.account = <AutoAccount> account
  }

  public async getAuthContext(config: VeridaDatabaseAuthTypeConfig = {
    deviceId: "Test device",
    force: false
  }): Promise<VeridaDatabaseAuthContext> {
    const serverUrl = config && config.endpointUri ? config.endpointUri : this.serviceEndpoint

    // If we have an invalid access token, clear it
    if (this.contextAuth && config.invalidAccessToken) {
      this.contextAuth.accessToken = undefined
    }

    // We already have a context auth object, so reuse it unless
    // requested to force create or have a missing access token.
    // This can happen if the access token has expired when being
    // used and it can automatically be re-requested.
    if (this.contextAuth && !config.force && this.contextAuth.accessToken) {
      return this.contextAuth
    }

    const did = await this.account!.did()

    // No context auth or no refresh token, so generate it by signing a consent message
    if (!this.contextAuth || !this.contextAuth.refreshToken) {
      // @todo: get a new refresh token if getting close to expiring?

      let authJwt
      try {
        // Generate an auth token to start auth process
        const authJwtResponse = await this.getAxios(this.contextName).post(serverUrl + "auth/generateAuthJwt",{
          did,
          contextName: this.contextName
        }, {
          timeout: this.timeout
        })

        authJwt = authJwtResponse.data.authJwt
      } catch (err: any) {
        throw new Error(`Unable to connect to storage node (${serverUrl}): ${err.message}`)
      }

      let refreshResponse
      try {
        // Generate a refresh token by authenticating
        const consentMessage = `Authenticate this application context: "${this.contextName}"?\n\n${did.toLowerCase()}\n${authJwt.authRequestId}`
        // const keyring = await this.account.keyring(this.contextName)
        // const signature = await keyring.sign(consentMessage)
        const signature = await this.account.sign(consentMessage)

        refreshResponse = await this.getAxios(this.contextName).post(serverUrl + "auth/authenticate",{
          authJwt: authJwt.authJwt,
          did,
          contextName: this.contextName,
          signature,
          deviceId: config.deviceId
        }, {
          timeout: this.timeout
        });

        //console.log('refresh response', refreshResponse.data)
      } catch (err: any) {
        throw new ContextAuthorizationError("Expired refresh token")
      }

      //console.log("authenticate response", refreshResponse.data)

      const refreshToken = refreshResponse.data.refreshToken
      const host = refreshResponse.data.host
      const accessToken = refreshResponse.data.accessToken

      this.contextAuth = {
        refreshToken,
        accessToken,
        host,
        endpointUri: serverUrl,
        publicSigningKey: this.signKey
      }

      //console.log(this.contextAuth!)

      return this.contextAuth!
    }

    // No access token, but have a refresh token, so generate access token
    if (this.contextAuth && !this.contextAuth.accessToken) {
      //console.log('getContextAuth(): no access token, but refresh token, so generating access token')

      try {
        const accessResponse = await this.getAxios(this.contextName).post(serverUrl + "auth/connect",{
          refreshToken: this.contextAuth.refreshToken,
          did,
          contextName: this.contextName
        }, {
          timeout: this.timeout
        });

        const accessToken = accessResponse.data.accessToken
        this.contextAuth.accessToken = accessToken
        return this.contextAuth
      } catch (err: any) {
        // Refresh token is invalid, so raise an exception that will be caught within the protocol
        // and force the sign in to be restarted
        if (err.message == 'Request failed with status code 401') {
          throw new ContextAuthorizationError("Expired refresh token")
        } else {
          throw err
        }
      }
    }

    // @todo: test if connection is valid?

    return this.contextAuth!
  }

  public async disconnectDevice(deviceId: string="Test device"): Promise<boolean> {
    const contextAuth = await this.getAuthContext()

    const did = await this.account.did();

    const consentMessage = `Invalidate device for this application context: "${this.contextName}"?\n\n${did.toLowerCase()}\n${deviceId}`
    const signature = await this.account.sign(consentMessage)
    
    try {
      const response = await this.getAxios(this.contextName).post(`${contextAuth.endpointUri}auth/invalidateDeviceId`, {
          did,
          contextName: this.contextName,
          deviceId: deviceId,
          signature
      }, {
        timeout: this.timeout
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