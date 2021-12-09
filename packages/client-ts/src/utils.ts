import EncryptionUtils from "@verida/encryption-utils";

export function generateObjectUri(
    did: string,
    contextName: string,
    databaseName: string,
        itemId?: string,
        params?: { key?: string }
    ): string {
    const contextHash = EncryptionUtils.hash(`${did}/${contextName}`)
        let uri = `verida://${did}/${contextHash}`

    if (databaseName) {
    uri += `/${databaseName}`
    }

    if (itemId) {
    uri += `/${itemId}`;
    }

    if (params && params.key) {
        const encryptionKey = Buffer.from(params.key).toString('hex');
        uri += '?key=' + encryptionKey;
    }

    return uri;
}