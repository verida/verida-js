import { VdaClientConfig } from '@verida/types'
import { BigNumber, ethers } from "ethers";
import { getVeridaSign, getVeridaSignWithNonce } from "@verida/vda-common";
import { explodeDID } from '@verida/helpers'
import { VeridaClientBase } from '@verida/vda-client-base'

export interface IAppDataItem {
    key: string
    value: string
}

export class VeridaNameClient extends VeridaClientBase {

    protected usernameCache: Record<string, string> = {}

    public constructor(config: VdaClientConfig) {
        super(config, "nameRegistry");
    }

    /**
     * Get a nonce from DIDRegistry contract
     * @returns nonce of DID
     */
     public async nonceFN() {
        if (!this.vdaWeb3Client) {
            throw new Error(`Config must specify 'did' or 'signKey'`);
        }

        const response = await this.vdaWeb3Client.nonce(this.didAddress);
        if (response.data === undefined) {
            throw new Error('Error in getting nonce');
        }
        return response.data;
    }

    /**
     * Get a signature for {@link BlockchainApi#register} function
     * @param name Name to register
     * @param did DID address
     * @param signKey Verida account key to generate signature
     * @returns Signature
     */
     protected async getRegisterSignature (
        name: string,
        did: string,
        signKey: string
    ) {
        let rawMsg = ethers.utils.solidityPack(['string', 'address'], [name, did]);
        return getVeridaSignWithNonce(rawMsg, signKey, await this.nonceFN());
    };

    /**
     * Register a username to the did address
     * @param username Name to register
     */
    public async register(username: string) {
        if (this.readOnly) {
            throw new Error(`Unable to submit to blockchain. No 'signKey' provided in config.`);
        }

        if (!this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. No 'signKey' provided in config.`);
        }

        username = username.toLowerCase();

        const signature = await this.getRegisterSignature(username, this.didAddress!, this.config.signKey!);
        const response = await this.vdaWeb3Client!.register(username, this.didAddress!, signature);

        if (response.success !== true) {
            throw new Error(`Failed to register: ${response.reason}`);
        }

        this.usernameCache[username] = `did:vda:${this.blockchainAnchor}:${this.didAddress}`;
    }

    /**
     * Unregister a username from the did address
     * @param username Name to be unregistered
     */
    public async unregister(username: string) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`);
        }

        username = username.toLowerCase();

        const signature = await this.getRegisterSignature(username, this.didAddress!, this.config.signKey!);
        const response = await this.vdaWeb3Client!.unregister(username, this.didAddress, signature);

        if (response.success !== true) {
            throw new Error(`Failed to unregister username: ${username} (${response.reason})`);
        }

        delete this.usernameCache[username];
    }

    /**
     * Get the username list of a DID address
     * 
     * @param did DID to lookup the username for
     * @returns username list 
     */
    public async getUsernames(did: string): Promise<string[]> {
        let response;
        let didAddress = did.toLowerCase();
        if (didAddress.match('did')) {
            const { address } = explodeDID(did);
            didAddress = address;
        }

        // Lookup usernames from cache
        const usernames = Object.entries(this.usernameCache)
            .filter(([, existingDid]) => existingDid === did)
            .map(([username, existingDid]) => username);
        
        if (usernames.length) {
            return usernames;
        }

        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getUserNameList(didAddress)
                if (response.success !== true) {
                    if (response.errorObj?.errorName === 'InvalidAddress') {
                        return [];
                    }

                    throw new Error(response.reason);
                }

                return response.data;
            } else {
                response = await this.contract!.callStatic.getUserNameList(didAddress);

                return response;
            }
        } catch (err:any ) {
            if (err.errorObj?.errorName === 'InvalidAddress' || err.errorName === 'InvalidAddress' ) {
                return [];
            }
            throw new Error(`Failed to get usernames for DID: ${didAddress} (${err.message})`);
        }
    }

    /**
     * Return the DID address for a given username
     * 
     * @param username username registered by {@link register}
     * @returns DID address
     */
    public async getDID(username: string): Promise<string> {
        username = username.toLowerCase();
        if (this.usernameCache[username]) {
            return this.usernameCache[username];
        }

        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.findDID(username);

                if (response.success !== true) {
                    throw new Error(`Not found`);
                }

                response = response.data;
            } else {
                response = await this.contract!.callStatic.findDID(username);

                if (!response) {
                    throw new Error(`Not found`);
                }
            }

            const did = `did:vda:${this.blockchainAnchor}:${response}`;
            this.usernameCache[username] = did;
            return did;
        } catch (err:any ) {
            throw new Error(`Failed to locate the DID for username: ${username} (${err.message})`);
        }
    }

    /**
     * Return limit of names per DID
     * @returns Limit of names
     */
    public async maxNamesPerDID(): Promise<BigNumber> {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.maxNamesPerDID();

                if (response.success !== true) {
                    throw new Error(`Failed to get limit of names per DID`);
                }

                response = response.data;
            } else {
                response = await this.contract!.callStatic.maxNamesPerDID();

                if (!response) {
                    throw new Error(`Failed to get limit of names per DID`);
                }
            }
            return response;
        } catch (err:any ) {
            throw new Error(`Failed to get limit of names: (${err.message})`);
        }
    }

    /**
     * Get the token address for paying the app register fee
     * @returns Address
     */
    public async getTokenAddress(): Promise<string> {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getTokenAddress();

                if (response.success !== true) {
                    throw new Error(`Failed to get the token address`);
                }

                response = response.data;
            } else {
                response = await this.contract!.callStatic.getTokenAddress();

                if (!response) {
                    throw new Error(`Failed to get the token address`);
                }
            }
            return response;
        } catch (err:any ) {
            throw new Error(`Failed to get the token address: (${err.message})`);
        }
    }

    /**
     * Get the fee for registering an application
     * @returns Token amount
     */
    public async getAppRegisterFee(): Promise<BigNumber> {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getAppRegisterFee();

                if (response.success !== true) {
                    throw new Error(`Failed to get the app registering fee`);
                }

                response = response.data;
            } else {
                response = await this.contract!.callStatic.getAppRegisterFee();

                if (!response) {
                    throw new Error(`Failed to get the app registering fee`);
                }
            }
            return response;
        } catch (err:any ) {
            throw new Error(`Failed to get the app registering fee: (${err.message})`);
        }
    }

    /**
     * Check whether app registering enabled
     * @returns true if enabled
     */
    public async isAppRegisterEnabled(): Promise<boolean> {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.isAppRegisterEnabled();

                if (response.success !== true) {
                    throw new Error(`Failed to check app registering enabled`);
                }

                response = response.data;
            } else {
                response = await this.contract!.callStatic.isAppRegisterEnabled();

                if (!response) {
                    throw new Error(`Failed to check app registering enabled`);
                }
            }
            return response;
        } catch (err:any ) {
            throw new Error(`Failed to check app registering enabled: (${err.message})`);
        }
    }

    /**
     * Get a {requestSignature, requestProof} for `registerApp()` and `deregisterApp()` functions
     * @param ownerName String
     * @param appName String
     * @param appData Only used in `registerApp()` function
     * @returns Signature
     */
    protected async getAppSignature (
        ownerName: string,
        appName: string,
        appData?: IAppDataItem[],
    ) {
        let rawMsg = ethers.utils.solidityPack(
            ['address','string'], 
            [this.didAddress!, `${ownerName}${appName}`]);
        
        if (appData !== undefined) {
            for (let i = 0; i < appData.length; i++) {
                rawMsg = ethers.utils.solidityPack(
                    ['bytes', 'string'],
                    [rawMsg, `${appData[i].key}${appData[i].value}`]
                );
            }
        }

        const requestSignature = getVeridaSignWithNonce(rawMsg, this.config.signKey!, await this.nonceFN());

        const proofMsg = `${this.didAddress}${this.didAddress}`;
        const requestProof = getVeridaSign(proofMsg, this.config.signKey!);

        return { requestSignature, requestProof };
    };

    /**
     * Registern an app
     * @param ownerName String 
     * @param appName String
     * @param appData Array of app meta data items
     */
    public async registerApp(
        ownerName: string,
        appName: string,
        appData: IAppDataItem[],
    ) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`);
        }

        const  {requestSignature, requestProof} = await this.getAppSignature(ownerName, appName, appData);

        const response = await this.vdaWeb3Client!.registerApp(
            this.didAddress,
            ownerName,
            appName,
            appData,
            requestSignature,
            requestProof
        );

        if (response.success !== true) {
            throw new Error(`Failed to register an application (${response.reason})`);
        }
    }

    /**
     * Unregister an app
     * @param ownerName String
     * @param appName String
     */
    public async deregisterApp(
        ownerName: string,
        appName: string,
    ) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`);
        }

        const  {requestSignature, requestProof} = await this.getAppSignature(ownerName, appName);

        const response = await this.vdaWeb3Client!.deregisterApp(
            this.didAddress,
            ownerName,
            appName,
            requestSignature,
            requestProof
        );

        if (response.success !== true) {
            throw new Error(`Failed to deregister an application (${response.reason})`);
        }
    }

    /**
     * Update or add an meta data item to the registered app
     * @param ownerName String
     * @param appName String
     * @param item Item to be added or updated
     */
    public async updateApp(
        ownerName: string,
        appName: string,
        item: IAppDataItem
    ) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`);
        }

        const  {requestSignature, requestProof} = await this.getAppSignature(ownerName, appName, [item]);

        const response = await this.vdaWeb3Client!.updateApp(
            this.didAddress,
            ownerName,
            appName,
            item,
            requestSignature,
            requestProof
        );

        if (response.success !== true) {
            throw new Error(`Failed to update an application (${response.reason})`);
        }
    }

    /**
     * Get an app meta data 
     * @param ownerName String
     * @param appName String
     * @returns Array of meta data item
     */
    public async getApp(ownerName: string, appName:string): Promise<any[]> {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getApp(ownerName, appName);

                if (response.success !== true) {
                    throw new Error(`Failed to get an app`);
                }

                response = response.data;
            } else {
                response = await this.contract!.callStatic.getApp(ownerName, appName);

                if (!response) {
                    throw new Error(`Failed to get an app`);
                }
            }
            return response;
        } catch (err:any ) {
            throw new Error(`Failed to get an app: (${err.message})`)
        }
    }

    /**
     * Get the `NameRegistry` contract version
     * @returns Version string
     */
    public async getVersion(): Promise<string> {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getVersion()

                if (response.success !== true) {
                    throw new Error(`Failed to get the contract version`);
                }

                response = response.data;
            } else {
                response = await this.contract!.callStatic.getVersion()

                if (!response) {
                    throw new Error(`Failed to get the contract version`);
                }
            }
            return response;
        } catch (err:any ) {
            throw new Error(`Failed to get the contract version: (${err.message})`);
        }
    }


    /**
     * Check the given suffix is registered
     * @param suffix Suffix to be checked
     * @returns true if registered
     */
    public async isValidSuffix(suffix: string): Promise<boolean> {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.isValidSuffix(suffix);

                if (response.success !== true) {
                    throw new Error(`Failed to check the suffix`);
                }

                response = response.data;
            } else {
                response = await this.contract!.callStatic.isValidSuffix(suffix);

                if (!response) {
                    throw new Error(`Failed to check the suffix`);
                }
            }
            return response;
        } catch (err:any ) {
            throw new Error(`Failed to check the suffix: (${err.message})`)
        }
    }

    /**
     * Return the list of suffixes registered
     * @returns list of suffixes
     */
    public async getSuffixList(): Promise<string[]> {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getSuffixList();

                if (response.success !== true) {
                    throw new Error(`Failed to get the suffixes`);
                }

                response = response.data;
            } else {
                response = await this.contract!.callStatic.getSuffixList();

                if (!response) {
                    throw new Error(`Failed to get the suffixes`);
                }
            }
            return response;
        } catch (err:any ) {
            throw new Error(`Failed to get the suffixes: (${err.message})`)
        }
    }



}