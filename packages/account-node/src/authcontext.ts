import { AccountConfig, AuthContext, AuthTypeConfig, VeridaDatabaseAuthContext } from '@verida/account'
import { NodeAccountConfig } from './interfaces'
import LimitedAccount from './limited'
import { Interfaces } from '@verida/storage-link'
import VeridaDatabaseAuthType from "./authTypes/VeridaDatabase"

/**
 * A NodeJs account that only signs messages for a limited list of contexts.
 * 
 * Used for testing.
 */
export default class AuthContextAccount extends LimitedAccount {

    /**
     * This will need to be refactored when more db engines are supported.
     * 
     * We are assuming we are dealing with a Verida Database Auth Context and then injecting
     * a known context object into the in memory database.
     * 
     * This is used for testing, by setting invalid access / request tokens in unit tests
     * 
     * @param accountConfig 
     * @param autoConfig 
     * @param signingContext 
     * @param authContext 
     */
    constructor(accountConfig: AccountConfig, autoConfig: NodeAccountConfig, signingContext: string, authContext: VeridaDatabaseAuthContext) {
        const signingContexts = [signingContext]
        super(accountConfig, autoConfig, signingContexts)

        this.contextAuths[signingContext] = new VeridaDatabaseAuthType(this, signingContext, {
            endpointUri: authContext.endpointUri,
            type: 'VeridaDatabase'
        }, authContext.publicSigningKey!)

        this.contextAuths[signingContext].setAuthContext(authContext)

    }
    
    public async getAuthContext(contextName: string, contextConfig: Interfaces.SecureContextConfig, authConfig: AuthTypeConfig, authType = "database"): Promise<AuthContext> {
        return super.getAuthContext(contextName, contextConfig, authConfig, authType)
    }

}