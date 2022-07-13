import { getResolver } from './resolver'
import { VdaDidController } from './controller'
import {
  bytes32toString,
  DEFAULT_REGISTRY_ADDRESS,
  identifierMatcher,
  interpretIdentifier,
  legacyAlgoMap,
  legacyAttrTypes,
  stringToBytes32,
  verificationMethodTypes,
  Errors,
} from './helpers'

import { CallType } from '@verida/web3'
import { VeridaWeb3ConfigurationOption } from './configuration'

export {
  DEFAULT_REGISTRY_ADDRESS as REGISTRY,
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
  VeridaWeb3ConfigurationOption,
}
