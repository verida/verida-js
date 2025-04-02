/**
 * Build a context consent message for a given DID and context name
 *
 * @param did - The DID to include in the message
 * @param contextName - The name of the context to include in the message
 * @returns A formatted message string
 */
export function buildContextConsentMessage(did: string, contextName: string) {
    const lowerCaseDid = did.toLowerCase()
    return `Do you wish to unlock this storage context: "${contextName}"?\n\n${lowerCaseDid}`
}
