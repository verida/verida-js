import EncryptionUtils from '@verida/encryption-utils'

/**
 * @category
 * Modules
 */
class Utils {
  static sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  }

  // DID + context name + DB Name + readPerm + writePerm
  static buildDatabaseHash(databaseName: string, contextName: string, did: string) {
    let text = [
        did.toLowerCase(),
        contextName,
        databaseName,
    ].join("/");

    const hash = EncryptionUtils.hash(text).substring(2);

    // Database name in CouchDB must start with a letter, so prepend a `v`
    return "v" + hash;
}

  /**
   * Build an MD5 hash from an array
   *
   * @param {array} parts Array of components to build the hash
   */
  /*static md5FromArray(parts: string[]) {
        let text = parts.join("/")
        return crypto.createHash('md5').update(text).digest("hex")
    }*/
}

export default Utils;
