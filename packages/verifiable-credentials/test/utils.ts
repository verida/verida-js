
import { AutoAccount } from '@verida/account-node';
import { Client, Context, Network, Utils } from '@verida/client-ts';
import { ClientConfig, EnvironmentType } from '@verida/types'
import CONFIG from './config';

/**
 * 
 * @param privateKey account private key unable creation of verida account 
 * @param contextName application context name
 * @param environment network 
 * @returns  an application {context} of the connected account
 */

export async function connectAccount(privateKey: string, contextName: string, environment: EnvironmentType): Promise<Context> {
    const account = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS,
        {
            didClientConfig: CONFIG.DID_CLIENT_CONFIG,
            privateKey: privateKey,
            environment: EnvironmentType.TESTNET,
        }
    )

    const did = await account.did()

    const context = await Network.connect({
        context: {
            name: contextName,
        },
        client: {
            environment: environment,
        },
        account,
    });

    return context as Context;
};

/**
 * 
 * @param uri vda decoded URI
 * @param environment current network
 * @returns an application {context} of the connected account
 */
export async function getClientContext(uri: string, environment: EnvironmentType): Promise<Context> {

    const clientConfig: ClientConfig = {
        environment: environment
    }

    const url = Utils.explodeVeridaUri(uri)

    const context = await new Client(clientConfig).openExternalContext(
        url.contextName,
        url.did
    );

    return <Context> context
}