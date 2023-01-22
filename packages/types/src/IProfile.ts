import { IContext } from "./IContext";

export interface ProfileDocument {
    _id: string;
    [key: string]: string;
  }

export interface IProfile extends EventEmitter {

  constructor(
    context: IContext,
    did: string,
    profileName: string,
    writeAccess: boolean,
    isPrivate: boolean
  ): void

get(
    key: string,
    options?: any,
    extended?: boolean
  ): Promise<any | undefined> 
  
    delete(key: string): Promise<boolean>
  getMany(filter: any, options: any): Promise<any>
  
  set(key: string, value: any): Promise<any> 
  
  setMany(data: any): Promise<any> 
  
  listen(callback: any): Promise<any>
  
  getRecord(): Promise<ProfileDocument>
  
  saveRecord(record: object): Promise<boolean>
  
  init(): Promise<void>
}
