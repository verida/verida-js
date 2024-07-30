import { AutoAccount } from '@verida/account-node';
import { Client, Context, Network } from '@verida/client-ts';
import { explodeVeridaUri } from '@verida/helpers';
import { ClientConfig, Network } from '@verida/types'
import CONFIG from './config';

/**
 * 
 * @param privateKey account private key unable creation of verida account 
 * @param contextName application context name
 * @param environment network 
 * @returns  an application {context} of the connected account
 */

export async function connectAccount(privateKey: string, contextName: string, network: Network): Promise<Context> {
    const account = new AutoAccount(
        {
            network,
            didClientConfig: CONFIG.DID_CLIENT_CONFIG,
            privateKey: privateKey
        }
    )

    const context = await Network.connect({
        context: {
            name: contextName,
        },
        client: {
            network
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

    const uriParts = explodeVeridaUri(uri)

    const context = await new Client(clientConfig).openExternalContext(
        uriParts.contextName,
        uriParts.did
    );

    return <Context> context
}