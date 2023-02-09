require('dotenv').config();

import { getVeridaContract } from '../src/index';
import {JsonRpcProvider} from '@ethersproject/providers';
import {BigNumber, ethers, Wallet} from 'ethers';
import EncryptionUtils from '@verida/encryption-utils';
import { VeridaWeb3Config, Web3GasConfiguration, Web3SelfTransactionConfig } from '@verida/types';

const _ = require('lodash');

// import Axios from "axios";

const PORT = process.env.SERVER_PORT ? process.env.SERVER_PORT : 5021;
const SERVER_URL = `http://localhost:${PORT}`;

/*
export async function getMaticFee(isProd: boolean) {
  let maxFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
  let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
  const gasLimit = ethers.BigNumber.from(50000000000); // fallback to 50 gwei

  try {
    const { data } = await Axios({
      method: 'get',
      url: isProd
        ? 'https://gasstation-mainnet.matic.network/v2'
        : 'https://gasstation-mumbai.matic.today/v2',
    });
    console.log('Matic data : ', data);

    maxFeePerGas = ethers.utils.parseUnits(
      Math.ceil(data.fast.maxFee) + '',
      'gwei'
    );
    maxPriorityFeePerGas = ethers.utils.parseUnits(
      Math.ceil(data.fast.maxPriorityFee) + '',
      'gwei'
    );
  } catch {
    // ignore
    console.log('Error in get gasfee');
  }

  return { maxFeePerGas, maxPriorityFeePerGas, gasLimit };
}
*/

export function getVeridaWeb3Instance(
  contractName: 'DidRegistry' | 'NameRegistry',
  globalGasConfiguration?: Web3GasConfiguration,
  methodDefaults?: Record<string, Web3GasConfiguration>
) {
  const args = process.argv.slice(2);
  // console.log("ARGS : ", args);
  const testMode = args.length > 0 && args.includes('gasless') ? 'gasless' : 'direct';
  // args.length > 0 && args[0] === 'direct' ? args[0] : 'gasless';
  // console.log('Test mode : ', testMode);

  const TARGET_NET = process.env.RPC_TARGET_NET;
  if (TARGET_NET === undefined) {
    throw new Error('RPC_TARGET_NET not defiend in env');
  }
  // console.log('Target Net : ', TARGET_NET);

  const RPC_URL = process.env[TARGET_NET];
  if (RPC_URL === undefined) {
    throw new Error('RPC url not defined in env');
  }
  // console.log('RPC URL : ', RPC_URL);

  const CONTRACT_ADDRESS =
    process.env[`CONTRACT_ADDRESS_${TARGET_NET}_${contractName}`];
  if (CONTRACT_ADDRESS === undefined) {
    throw new Error('Contract address not defined in env');
  }

  const provider = new JsonRpcProvider(RPC_URL);
  const txSigner = new Wallet(process.env.PRIVATE_KEY!, provider);

  const contractABI = require(`./abi/${contractName}.json`);

  let contract;

  if (testMode === 'direct') {
    let configuration: VeridaWeb3Config = {
      abi: contractABI,
      address: CONTRACT_ADDRESS,
      provider: provider,
      signer: txSigner,
    };

    if (globalGasConfiguration !== undefined) {
      configuration = _.merge(configuration, globalGasConfiguration);
    }

    if (methodDefaults !== undefined) {
      (<Web3SelfTransactionConfig>configuration).methodDefaults =
        methodDefaults;
    }

    contract = getVeridaContract('web3', configuration);
  } else {
    contract = getVeridaContract('gasless', {
      abi: contractABI,
      address: CONTRACT_ADDRESS,
      serverConfig: {
        headers: {
          'context-name': 'Verida Test',
        },
      },
      postConfig: {
        headers: {
          'user-agent': 'Verida-Vault',
        },
      },
      endpointUrl: SERVER_URL,
    });
  }

  return contract;
}

export async function getVeridaSignWithNonce(
  rawMsg: string,
  privateKey: string,
  nonce: number
) {
  rawMsg = ethers.utils.solidityPack(['bytes', 'uint256'], [rawMsg, nonce]);
  return getVeridaSign(rawMsg, privateKey);
}

export const getVeridaSign = (rawMsg: string, privateKey: string) => {
  const privateKeyArray = new Uint8Array(
    Buffer.from(privateKey.slice(2), 'hex')
  );
  return EncryptionUtils.signData(rawMsg, privateKeyArray);
};

export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export const dids = [
  {
    address: '0x8Ec5df9Ebc9554CECaA1067F974bD34735d3e539',
    privateKey:
      '0x42d4c8a6b73fe84863c6f6b5a55980f9a8949e18ed20da65ca2033477ad563f0',
    publicKey:
      '0x042b816206dfd7c694d627ff775b9c151319b9a0e54de94d18e61619372fc713664dc677d5247adc2d4f8722b227bd9504b741ea380d5e7887a5698a7a634ec6ae',
  },
  {
    address: '0xE3A441c4e699433FCf1262246Cf323d8e4302998',
    privateKey:
      '0xb5867e47d06b2c2679c1dadfa2f3990c5db7a378acc9fb1c0d14d7861adf3490',
    publicKey:
      '0x04b24294e9a6880936512213d2a25a97213f870d50e8f6df553a0fc0ede5d15f2154dabb73042f40a9492da2b200f9679d6038f93d0b5f506c14f14f132b860bbe',
  },
  {
    address: '0x0162aE4B571E9daB51309f885200aDdF04F33747',
    privateKey:
      '0x8a4c7e289560bd39d1820fade8f953ba49c1281eb7056d1affde76a7a05c01a3',
    publicKey:
      '0x0403da4e7946c84a92ddb09cec9fce8f0cb08e3316856e55168d3e0bfa47f8a5a08e1f2a75c78353450010b6d8835046fbf8a093f9eb7431f0930afebbbbca81bf',
  },
  {
    address: '0x58B24541eAb4F50E05CeB08374CeAE6794dD1143',
    privateKey:
      '0x854eb960003cd3b6e1111c887244db09a354925c374439a8d849b55fc8dda0ef',
    publicKey:
      '0x04ae9b3163a8b6b0a72047d47552bc68dc46dc0f846ecaaf303007a3be52dbb2f1079cb41f3590135aa864e4c712d9f9f1b173f738761b021ad04ed816ca70fa67',
  },
  {
    address: '0xb61166251d6dFa18B547b954ecE5D8a0408dc7cC',
    privateKey:
      '0xdc5a535b4f3f3ec42f7f5fb28d61f02a493f7c2a3ff3fdc6950610473f9a11c8',
    publicKey:
      '0x0413f0a7a9040f9d99e9a0d1c53bea87d7ee8096c95f18b6d22fb74b01c7ca713de27a94b17c857eb39d67278f7633a40e73a75d2e6643298f3d66b77b14af77e5',
  },
  {
    address: '0xe484BA18d807AF41207E9D5E4983906Afe2779b6',
    privateKey:
      '0xe7c0985b8fe575350dba0763486a173456d41221f50ed936a20448249ae53ca7',
    publicKey:
      '0x04acd5fd52aaa3f9d6867e524bdc0b1716f98fc6300a87cef2a0b8054103acb33530948388e85f8280cda33deda45aae8a416fbaf3651981575710b401e1ee94c6',
  },
  {
    address: '0xAf8b9268cA2C57ab0b689C1B42D2Cf3E86b6CF36',
    privateKey:
      '0x869a215c3a5adee1b6243c7d3f98c2b1976154927ef7c9bcaf141b870d9884f5',
    publicKey:
      '0x04d8e3a16c17ed0a159ce27f4b6eae15981fa0c88000744121b191d2411eed55635d4b538e8065e21c8a5b68d44808d02ed71570a042b50ab797f8e3b34d2c6e9e',
  },
  {
    address: '0x6bbEf7641AcDDDF8a93C71edA863a4a70dC1801b',
    privateKey:
      '0xef66e31345bb2ccb25e25ec9a650156c6f93caf883db04008a70e183eba4092d',
    publicKey:
      '0x04a205faab72bf658e51cd356aa19a99c41fa0e70a5bb030096dcc737a01568bc260e573dc9ffc09480cc6ce5451335cda23e24cf945df4e137a2e850bac2b1320',
  },
  {
    address: '0xeea7e0781317408d84aD70d1AA8c7553D3D31cA5',
    privateKey:
      '0x78538a24889f4eaa6186ee201bf7aeea89bdad695ab85d95871eac603665c620',
    publicKey:
      '0x040f8ef908ca54fb1a45d8dd4463e6930c1d96c674d75f3c27e42d5f60ae2123837b47d1b249e8a015e3dcf2b669a7f30884a80ff57bf3332bf96698626f31a5da',
  },
];
