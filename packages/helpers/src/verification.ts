import Axios from 'axios'

/**
 * Uses `/.well-known/did.json` standard
 * 
 * @see https://w3c-ccg.github.io/did-method-web/
 * @see https://team.verida.network/.well-known/did.json
 * 
 * @param did DID that is expected to control the domain name
 * @param domain Domain (ie: team.verida.network) that is expected to be controlled by the DID. If protocol is specified (ie: `https`) it will automatically be stripped. HTTPS is forced.
 */
export async function verifyDidControlsDomain(did: string, domain: string): Promise<boolean> {
    // Strip out protocol if specified
    domain = domain.replace(/^https?:\/\//, '')
    // Remove any trailing '/'
    domain = domain.replace(/\/$/,'')
    // Force SSL
    const didJsonUrl = `https://${domain}/.well-known/did.json`
    try {
        const response = await Axios.get(didJsonUrl)
        const didJson = response.data
        if (didJson.id !== `did:web:${domain}`) {
            return false
        }

        const match = didJson.verificationMethod!.find((entry: any) => {
            return (
                // Verify authentication and entry ID match the domain
                entry.id.match(`did:web:${domain}`) &&
                didJson.authentication.find((authEntry: any) => authEntry == entry.id) &&
                // Verify the entry matches the DID
                entry.controller.toLowerCase().match(`${did.toLowerCase()}`)
            )
        })

        return match != undefined
    } catch (err) {
        return false
    }
}