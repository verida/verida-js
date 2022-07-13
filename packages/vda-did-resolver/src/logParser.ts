import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Log } from '@ethersproject/providers'
import { LogDescription } from '@ethersproject/abi'
import { bytes32toString, ERC1056Event } from './helpers'

function populateEventMetaClass(logResult: LogDescription, blockNumber: number): ERC1056Event {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {}
  if (logResult.eventFragment.inputs.length !== logResult.args.length) {
    throw new TypeError('malformed event input. wrong number of arguments')
  }
  logResult.eventFragment.inputs.forEach((input, index) => {
    let val = logResult.args[index]
    if (typeof val === 'object') {
      val = BigNumber.from(val)
    }
    if (input.type === 'bytes32') {
      val = bytes32toString(val)
    }
    result[input.name] = val
  })
  result._eventName = logResult.name
  result.blockNumber = blockNumber
  return result as ERC1056Event
}

export function logDecoder(contract: Contract, logs: Log[]): ERC1056Event[] {
  const results: ERC1056Event[] = logs.map((log: Log) => {
    const res = contract.interface.parseLog(log)
    const event = populateEventMetaClass(res, log.blockNumber)
    return event
  })
  return results
}
