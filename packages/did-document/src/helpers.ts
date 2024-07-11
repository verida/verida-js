/* eslint-disable prettier/prettier */
export function strip0x(input: string): string {
  return input.startsWith('0x') ? input.slice(2) : input
}