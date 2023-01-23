import { AuthContext, AuthTypeConfig } from "./AccountInterfaces"

export interface IAuthType {
    getAuthContext(config: AuthTypeConfig): Promise<AuthContext>

    setAuthContext(contextAuth: AuthContext): void

    disconnectDevice(deviceId: string): Promise<boolean>
}