import { ISignature } from "./interfaces";

/**
 * Generates a signature for the given dataset
 */
export class Signature implements ISignature {

    /**
     * Computes and returns the signature
     * @param data Source of data required to generate the Signature
     * @param options Nullable parameter which holds cryptograhic materials to generate a Signature
     */
    public async generateSignature(data: any, options: any): Promise<any> {
        const account = this.signContext.getAccount();
        const signDid = await account.did();
        const keyring = await account.keyring(this.signContextName);
    
        if (!data.signatures) {
          data.signatures = {};
        }
    
        const signContextHash = DIDDocument.generateContextHash(
          signDid,
          this.signContextName
        );
        const signKey = `${signDid}?context=${signContextHash}`;
    
        let _data = _.merge({}, data);
    
        delete _data["signatures"];
    
        data.signatures[signKey] = await keyring.sign(_data);
        return data;
    }
}