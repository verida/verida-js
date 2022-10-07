import _ from "lodash";
import { DIDDocument } from "@verida/did-document";
import { Context } from "..";
import Schema from "./schema";

export interface RecordSignatureOptions {
  signContext: Context,
}

/**
 * Generates a signature for the given record
 */
export class RecordSignature {

    /**
     * Computes and returns the signature
     * 
     * @param data Source of data required to generate the Signature
     * @param options required parameter
     */
    public static async generateSignature(data: any, options: RecordSignatureOptions): Promise<any> {
        const signContext = options.signContext;
        const signContextName = signContext.getContextName()
        const account = signContext.getAccount();
        const signDid = await account.did();
        const keyring = await account.keyring(signContextName);
    
        if (!data.signatures) {
          data.signatures = {};
        }
    
        const signContextHash = DIDDocument.generateContextHash(
          signDid,
          signContextName
        );
        const signKey = `${signDid}?context=${signContextHash}`;
    
        let _data = _.merge({}, data);
    
        delete _data["signatures"];
        
        if (_data['schema']) {
          _data['schema'] = Schema.getVersionlessSchemaName(_data['schema'])
        }
    
        data.signatures[signKey.toLowerCase()] = await keyring.sign(_data);
        return data;
    }
}