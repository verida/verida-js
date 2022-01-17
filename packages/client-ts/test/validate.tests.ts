'use strict'
const assert = require('assert')

import Schema from "../src/context/schema"

const SCHEMA_CONTACTS = 'https://common.schemas.verida.io/social/contact/latest/schema.json'

/**
 * Tests AVJ's 
 */
describe('Basic schema tests', function() {
    this.timeout(10000)

    it('can validate a larger schema', async function() {
        let schemaName = "https://schemas.testnet.verida.io/health/fhir/4.0.1/schema.json"
        const schema = await Schema.getSchema(schemaName)
        assert.ok(schema, 'Response received')

        const validate1 = await schema.validate({
            schema: schemaName
        })
        assert.ok(validate1 === false, 'Data correctly marked as invalid')
        assert.ok(schema.errors.length, 'Data correctly has a list of validation errors')
    });
 
    

});