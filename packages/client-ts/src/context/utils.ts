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
    
        const sig = await keyring.sign(_data)

        // Create empty signature object if this DID hasn't signed, or if this DID has an old signature format (string, not object)
        if (!data.signatures[signKey.toLowerCase()] || typeof(data.signatures[signKey.toLowerCase()]) === 'string') {
          data.signatures[signKey.toLowerCase()] = {}
        }

        data.signatures[signKey.toLowerCase()]['secp256k1'] = sig;
        return data;
    }
}

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}