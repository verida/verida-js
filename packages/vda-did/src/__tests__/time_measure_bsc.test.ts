/* eslint-disable prettier/prettier */
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'

import { VdaDID } from '../index'

import { privateKey } from '/mnt/Work/Sec/test.json'

const rpcUrl = 'https://speedy-nodes-nyc.moralis.io/20cea78632b2835b730fdcf4/bsc/testnet'

// const registryAddres = new Map<string, string>([
//   ['bscTest', '0x2862BC860f55D389bFBd1A37477651bc1642A20B'],
//   ['polygonTest', '0xcfE57be6585B201127CaB6bE079Ae2f95bf02214']
// ])


const identity = '0x599b3912A63c98dC774eF3E60282fBdf14cda748'.toLowerCase()

const provider = new JsonRpcProvider(rpcUrl);

const txSigner = new Wallet(privateKey, provider)
    
jest.setTimeout(600000)

function sleep(ms) {
  return new Promise((resolve) => {
      setTimeout(resolve, ms);
  });
}

describe('VdaDID', () => {
    it('Web-3 for adding service', async () => {
      const vdaDid = new VdaDID({
        identifier: identity,
        chainNameOrId : '0x61',     
        
        callType: 'web3',
        web3Options: {
          provider: provider,
          signer: txSigner
        }
      })

      const startTime = Date.now()
      console.log('Start : ', startTime)
      const txHash = await vdaDid.setAttribute(
        'did/svc/VeridaDatabase',
        'https://db.testnet.verida.io:5002##0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4600004##database',
        86400
      )
      // console.log(txHash)

      const endTime = Date.now()
      console.log('End : ', endTime)
  
      console.log('Time Consumed: ', endTime - startTime)
    })


    it('Meta for adding service', async () => {
      await sleep(2000)
      const testSignature = "0x67de2d20880a7d27b71cdcb38817ba95800ca82dff557cedd91b96aacb9062e80b9e0b8cb9614fd61ce364502349e9079c26abaa21890d7bc2f1f6c8ff77f6261c"
      const vdaDid = new VdaDID({
        identifier: identity,
        chainNameOrId : '0x61',     
        
        callType: 'gasless',
        web3Options: {
          veridaKey: testSignature,
          serverConfig: {
            headers: {
                'context-name' : 'Verida Test'
            } 
          },
          postConfig: {
              headers: {
                  'user-agent': 'Verida-Vault'
              }
          }
        }
      })

      const startTime = Date.now()
      console.log('Start : ', startTime)
      const txHash = await vdaDid.setAttribute(
        'did/svc/VeridaDatabase',
        'https://db.testnet.verida.io:5002##0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4600005##database',
        86400
      )
      // console.log(txHash)
      const endTime = Date.now()
      console.log('End : ', endTime)
  
      console.log('Time Consumed: ', endTime - startTime)
    })
})