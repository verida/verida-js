

export const assertIsValidDbResponse = function(assert: any, data: any) {
    assert.ok(data, 'Data returned')
    assert.ok(data.length && data.length > 1, 'Array returned with at least one row')
    // @todo: add seom helpful utilities to ensure resopnse is what is expected
    // assert.ok(data[0].hello == 'world', 'First result has expected value')
}