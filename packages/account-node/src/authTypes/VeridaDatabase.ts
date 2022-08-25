import Axios from "axios";
import AutoAccount from "../auto";
import { Account, VeridaDatabaseAuthContext, AuthType, VeridaDatabaseAuthTypeConfig } from "@verida/account";



export default class VeridaDatabaseAuthType implements AuthType {

  private contextAuth?: VeridaDatabaseAuthContext

  public async getAuthContext<AutoAccount extends Account>(account: AutoAccount, contextName: string, config: VeridaDatabaseAuthTypeConfig): Promise<VeridaDatabaseAuthContext> {
    const serverUrl = config.serverUrl
    const deviceId = config.serverUrl
    const forceAccessToken = config.forceAccessToken
    const publicSigningKey = config.publicSigningKey

    // @todo: how are invalid access tokens going to produce an error? how to catch and then regenerate?
    //  - expired token stored in session when loading the app
    //  - token expires while using the app

    // -------------------------

    // We already have a context auth object, so reuse it unless
    // requested to force create access token.
    // This can happen if the access token has expired when being
    // used and it can automatically be re-requested.
    if (this.contextAuth && !forceAccessToken) {
      //console.log('getContextAuth(): exists, returning')
      return this.contextAuth
    }

    const did = await account!.did()

    // No context auth or no refresh token, so generate it by signing a consent message
    if (!this.contextAuth || !this.contextAuth.refreshToken) {
      //console.log('getContextAuth(): no refreshtoken, generating')
      // @todo: get a new refresh token if getting close to expiring?

      let authJwt
      try {
        // Generate an auth token to start auth process
        const authJwtResponse = await this.getAxios(contextName).post(serverUrl + "auth/generateAuthJwt",{
          did,
          contextName
        })

        authJwt = authJwtResponse.data.authJwt
      } catch (err: any) {
        throw new Error(`Unable to connect to storage node (${serverUrl}): ${err.message}`)
      }

      let refreshResponse
      try {
        // Generate a refresh token by authenticating
        const consentMessage = `Authenticate this application context: "${contextName}"?\n\n${did.toLowerCase()}\n${authJwt.authRequestId}`
        const signature = await account!.sign(consentMessage)

        refreshResponse = await this.getAxios(contextName).post(serverUrl + "auth/authenticate",{
          authJwt: authJwt.authJwt,
          did,
          contextName,
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
        publicSigningKey
      }

      //console.log(this.contextAuth!)

      return this.contextAuth!
    }

    // No access token, but have a refresh token, so generate access token
    if (this.contextAuth && !this.contextAuth.accessToken) {
      //console.log('getContextAuth(): no access token, but refresh token, so generating access token')

      const accessResponse = await this.getAxios(contextName).post(serverUrl + "auth/connect",{
        refreshToken: this.contextAuth.refreshToken,
        did,
        contextName: contextName
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