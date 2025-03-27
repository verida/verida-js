import { BlockchainAnchor } from "@verida/types";

/**
 * Build a Verida DID identifier from a blockchain anchor and address
 *
 * @param blockchainAnchor - The blockchain network identifier (eg: 'testnet', 'mainnet')
 * @param address - Ethereum address to build the DID for
 * @returns A properly formatted Verida DID string (eg: 'did:vda:polpos:0x...')
 */
export function buildVeridaDidIdentifier(blockchainAnchor: BlockchainAnchor, address: string): string {
    return `did:vda:${blockchainAnchor}:${address}`
}
