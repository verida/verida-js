import * as index from '../index'

test('has export definitions', () => {
  expect.assertions(8)
  expect(index.REGISTRY).toBeDefined()
  expect(index.attrTypes).toBeDefined()
  expect(index.bytes32toString).toBeDefined()
  expect(index.delegateTypes).toBeDefined()
  expect(index.getResolver).toBeDefined()
  expect(index.identifierMatcher).toBeDefined()
  expect(index.stringToBytes32).toBeDefined()
  expect(index.verificationMethodTypes).toBeDefined()
})
