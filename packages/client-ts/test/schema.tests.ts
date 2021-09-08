'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import Schema from "../src/context/schema"
import CONFIG from './config'

const SCHEMA_CONTACTS = 'https://schemas.verida.io/social/contact/schema.json'

// Initialize the Verida Network even though it's not used
// This is becuase doing so will configure the schema paths
// from the default newtork config
const network = new Client({
    defaultDatabaseServer: {
        type: 'VeridaDatabase',
        endpointUri: 'http://localhost:5000/'
    },
    defaultMessageServer: {
        type: 'VeridaMessage',
        endpointUri: 'http://localhost:5000/'
    },
    ceramicUrl: CONFIG.CERAMIC_URL
})

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
            assert.ok(spec.required.length == 2 && spec.required[0] == 'firstName', 'Schema specification has expected required value')
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

            const validate1 = await schema.validate({})
            assert.ok(validate1 === false, 'Data correctly marked as invalid')
            assert.ok(schema.errors.length, 'Data correctly has a list of validation errors')

            const contact = {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john__smith.com'
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