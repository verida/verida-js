import _ from "lodash";
import { ISignature } from "./interfaces";

/**
 * Generates a signature for the given dataset
 */
export class Signature implements ISignature {

    /**
     * Computes and returns the signature
     * @param data Source of data required to generate the Signature
     * @param options required parameter
     */
    public async generateSignature(data: any, options: any): Promise<any> {
        const signContext = options.signContext;
        const account = signContext.getAccount();
        const signDid = await account.did();
        const keyring = await account.keyring(options.signContextName);
    
        if (!data.signatures) {
          data.signatures = {};
        }
    
        const signContextHash = options.DIDDocument.generateContextHash(
          signDid,
          options.signContextName
        );
        const signKey = `${signDid}?context=${signContextHash}`;
    
        let _data = _.merge({}, data);
    
        delete _data["signatures"];
    
        data.signatures[signKey] = await keyring.sign(_data);
        return data;
    }
}