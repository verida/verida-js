/* eslint-disable prettier/prettier */
// Copied from @verida/web3
export const knownNetworks: Record<string, string> = {
  mainnet: '0x89',
  testnet: '0x13881',
  hardhat: '0x7a69'
};

export function strip0x(input: string): string {
  return input.startsWith('0x') ? input.slice(2) : input
}