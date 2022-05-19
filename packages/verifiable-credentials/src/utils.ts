
import { AutoAccount } from '@verida/account-node';
import { Client, Context, EnvironmentType, Network, Utils } from '@verida/client-ts';
import config from './config';

/**
 * 
 * @param privateKey account private key unable creation of verida account 
 * @param contextName application context name
 * @param environment network 
 * @returns  an application {context} of the connected account
 */

export async function connectAccount(privateKey: string, contextName: string, environment: EnvironmentType): Promise<Context> {

    const context = await Network.connect({
        context: {
            name: contextName,
        },
        client: {
            environment: environment,
        },
        account: new AutoAccount(
            {
                defaultDatabaseServer: {
                    type: 'VeridaDatabase',
                    endpointUri: config.environments[environment].defaultDatabaseServerUrl as string,
                },
                defaultMessageServer: {
                    type: 'VeridaMessage',
                    endpointUri: config.environments[environment].defaultMessageServerUrl as string,
                },
            },
            {
                privateKey: privateKey,
                environment: EnvironmentType.TESTNET,
            }
        ),
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

    const clientConfig = {
        environment: environment,
        didServerUrl: config.environments[environment].didServerUrl
    }

    const url = Utils.explodeVeridaUri(uri)

    const context = await new Client(clientConfig).openExternalContext(
        url.contextName,
        url.did
    );

    return context
}