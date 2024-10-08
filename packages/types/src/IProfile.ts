import { IDatastore } from "./IDatastore";

export interface ProfileDocument {
    _id: string;
    [key: string]: string;
  }

export interface IProfile {
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

  getDs(): Promise<IDatastore>

  getErrors(): Promise<object>
}
