/* eslint-disable prettier/prettier */

import { veridaContractWhiteList } from './constants';
import { ethers } from 'ethers';
import { providers } from 'ethers';
import Axios from 'axios';

/**
 * Convert string to 32Bytes value
 * @param str Input string
 * @returns {string} 32bytes value
 */
export function stringToBytes32(str: string): string {
  const buffStr = '0x' + Buffer.from(str).slice(0, 32).toString('hex')
  return buffStr + '0'.repeat(66 - buffStr.length)
}

/**
 * Check contract address is Verida contract
 * @param contractAddress - Input contract address
 * @returns {boolean} - true if verida contract
 */
export function isVeridaContract(contractAddress: string) : boolean {
  return veridaContractWhiteList.includes(contractAddress.toLowerCase())
}

/**
 * Get Polygon fee data to send the transactions
 * @param gasStationUrl Gas station url to pull the gas inforamtion
 * @returns Matic fee data
 */
export async function getMaticFee(gasStationUrl: string, mode: string) {
  let maxFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
  let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
  // const gasLimit = ethers.BigNumber.from(50000000000); // fallback to 50 gwei

  try {
    const { data } = await Axios({
      method: 'get',
      url: gasStationUrl
    });

    maxFeePerGas = ethers.utils.parseUnits(
      Math.ceil(data[mode].maxFee) + '',
      'gwei'
    );
    maxPriorityFeePerGas = ethers.utils.parseUnits(
      Math.ceil(data[mode].maxPriorityFee) + '',
      'gwei'
    );
  } catch {
    // ignore
    console.log('Error in get gasfee from gas station url');
  }

  // return { maxFeePerGas, maxPriorityFeePerGas, gasLimit };
  return { maxFeePerGas, maxPriorityFeePerGas };
}

export async function checkEIP1559Enabled(provider?: providers.Provider, chainUrl?:string) : Promise<Boolean> {
  if (provider === undefined) {
    if (chainUrl === undefined) {
      return false;
    }

    provider = new ethers.providers.JsonRpcProvider(chainUrl);
  }
  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);

  return block.baseFeePerGas !== undefined;
}


// export async function getMaticFee(isProd: boolean) {
//   let maxFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
//   let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
//   const gasLimit = ethers.BigNumber.from(50000000000); // fallback to 50 gwei

//   const EXTRA_TIP_FOR_MINER = 100 //  gwei

//   try {
//     const { data } = await Axios({
//       method: 'get',
//       url: isProd
//         ? 'https://gasstation-mainnet.matic.network/v2'
//         : 'https://gasstation-mumbai.matic.today/v2',
//     });

//     console.log('//////////////', data);

//     const base_fee = parseFloat(data.estimatedBaseFee)
//     const max_priority_fee = data.fast.maxPriorityFee + EXTRA_TIP_FOR_MINER;
//     let max_fee_per_gas = base_fee + max_priority_fee

//     //  In case the network gets (up to 25%) more congested
//     max_fee_per_gas += (base_fee * 0.15)

//     //  cast gwei numbers to wei BigNumbers for ethers
//     maxFeePerGas = ethers.utils.parseUnits(max_fee_per_gas.toFixed(9), 'gwei')
//     maxPriorityFeePerGas = ethers.utils.parseUnits(max_priority_fee.toFixed(9), 'gwei')
//   } catch {
//     // ignore
//     console.log('Error in get gasfee');
//   }

//   return { maxFeePerGas, maxPriorityFeePerGas };
// }
