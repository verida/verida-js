import { AuthContext, AuthTypeConfig, IAccount, SecureContextPublicKey } from "@verida/types"
import { ServiceEndpoint } from "did-resolver"
import Account from "./account"

export class AuthType {

    protected contextAuth?: AuthContext
    protected account: Account
    protected contextName: string
    protected serviceEndpoint: ServiceEndpoint
    protected signKey: SecureContextPublicKey

    public constructor(account: Account, contextName: string, serviceEndpoint: ServiceEndpoint, signKey: SecureContextPublicKey) {
        this.account = account
        this.contextName = contextName
        this.serviceEndpoint = serviceEndpoint
        this.signKey = signKey
    }

    getAuthContext(config: AuthTypeConfig): Promise<AuthContext> {
        throw new Error("Not implemented")
    }

    setAuthContext(contextAuth: AuthContext) {
        this.contextAuth = contextAuth
    }

    disconnectDevice(deviceId: string="Test device"): Promise<boolean> {
        throw new Error("Not implemented")
    }
}