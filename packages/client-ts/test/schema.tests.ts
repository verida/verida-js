'use strict'
const assert = require('assert')

import Schema from "../src/context/schema"

const SCHEMA_CONTACTS = 'https://common.schemas.verida.io/social/contact/latest/schema.json'

/**
 * 
 */
describe('Schema tests', () => {
    // Instantiate utils

    describe('Basic schema tests', function() {
        this.timeout(10000)

        it('can open a known schema specification', async function() {
            const schema = await Schema.getSchema(SCHEMA_CONTACTS)
            assert.ok(schema, 'Response received')

            const spec = await schema.getSpecification()
            assert.ok(spec, 'Schema spec exists')
            assert.ok(spec.required.length == 3 && spec.required[0] == 'schema', 'Schema specification has expected required value')
        })

        it('can fetch a known schema JSON', async function() {
            const schema = await Schema.getSchema(SCHEMA_CONTACTS)
            assert.ok(schema, 'Response received')

            const json = await schema.getSchemaJson()
            assert.ok(json, 'Schema JSON fetched')
            assert.ok(json['title'] == 'Contact', 'Schema JSON has expected title value')
        })

        it('can validate correctly', async function() {
            const schema = await Schema.getSchema(SCHEMA_CONTACTS)
            assert.ok(schema, 'Response received')

            const validate1 = await schema.validate({
                schema: SCHEMA_CONTACTS
            })
            assert.ok(validate1 === false, 'Data correctly marked as invalid')
            assert.ok(schema.errors.length, 'Data correctly has a list of validation errors')

            const contact = {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john@smith.com',
                schema: SCHEMA_CONTACTS
            }
            const validate2 = await schema.validate(contact)
            assert.ok(validate2 === true, 'Data correctly marked as valid')            
        })

        it('can get appearance', async function() {
            const schema = await Schema.getSchema(SCHEMA_CONTACTS)
            assert.ok(schema, 'Response received')

            const appearance = await schema.getAppearance()
            assert.ok(appearance, 'Appearance loaded')
            assert.ok(appearance.style, 'Appearance has style metadata')
        })
    })

})