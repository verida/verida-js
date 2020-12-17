import { RemoteDatabaseOptions, RemoteClientAuthentication } from '../interfaces'
import Axios from 'axios'

export default class RemoteClient {

    private serverUrl: string
    private storageName: string
    private authentication?: RemoteClientAuthentication

    constructor(serverUrl: string, storageName: string) {
        this.serverUrl = serverUrl
        this.storageName = storageName
    }

    public setAuthentication(username: string, signature: string) {
        this.authentication = {
            username,
            signature
        }
    }

    public async getUser(did: string) {
        return this.getAxios(true).get(this.serverUrl + "user/get?did=" + did);
    }

    public async getPublicUser() {
        return this.getAxios(false).get(this.serverUrl + "user/public");
    }

    public async createUser(did: string) {
        return this.getAxios(true).post(this.serverUrl + "user/create", {
            did: did
        });
    }

    public async createDatabase(did: string, databaseName: string, options: RemoteDatabaseOptions = {}) {
        return this.getAxios(true).post(this.serverUrl + "user/createDatabase", {
            did: did,
            databaseName: databaseName,
            options: options
        });
    }

    public async updateDatabase(did: string, databaseName: string, options: RemoteDatabaseOptions = {}) {
        return this.getAxios(true).post(this.serverUrl + "user/updateDatabase", {
            did: did,
            databaseName: databaseName,
            options: options
        });
    }

    public getAxios(includeAuth: boolean) {
        let config: any = {
            headers: {
                "Application-Name": this.storageName
//                "Profile-Request": this.isProfile
            }
        }

        if (includeAuth) {
            if (!this.authentication) {
                throw new Error ('Unable to authenticate as there is no authentication defined')
            }

            config['auth'] = {
                username: this.authentication.username.replace(/:/g, "_"),
                password: this.authentication.signature
            }
        }

        return Axios.create(config)
    }

}