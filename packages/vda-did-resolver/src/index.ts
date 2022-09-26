import { getResolver } from './resolver'
import { VdaDidController } from './controller'
import {
  bytes32toString,
  identifierMatcher,
  interpretIdentifier,
  legacyAlgoMap,
  legacyAttrTypes,
  stringToBytes32,
  verificationMethodTypes,
  Errors,
} from './helpers'

import { CallType, VdaTransactionResult } from '@verida/web3'
import { VeridaWeb3ConfigurationOption } from './configuration'

export {
  getResolver,
  bytes32toString,
  stringToBytes32,
  VdaDidController,
  /**@deprecated */
  legacyAlgoMap as delegateTypes,
  /**@deprecated */
  legacyAttrTypes as attrTypes,
  verificationMethodTypes,
  identifierMatcher,
  interpretIdentifier,
  Errors,
  CallType,
  VdaTransactionResult,
  VeridaWeb3ConfigurationOption,
}
