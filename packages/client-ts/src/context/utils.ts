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
    public async generateSignature(data: any, options?: any): Promise<string> {
        throw new Error("Method not implemented.");
    }
}