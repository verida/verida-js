
export default class Utils {
    
    static sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms))
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