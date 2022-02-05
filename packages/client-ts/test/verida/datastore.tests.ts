'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'
import { RecordSignature } from '../../src/context/utils'

const DS_CONTACTS = 'https://common.schemas.verida.io/social/contact/latest/schema.json'

/**
 * 
 */
describe('Verida datastore tests', () => {
    let context, did1
    let context2, did2
    let DB_USER_ENCRYPTION_KEY

    const network = new Client({
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })

    const network2 = new Client({
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })

    describe('Manage datastores for the authenticated user', function() {
        this.timeout(100000)
        
        it('can open a datastore with owner/owner permissions', async function() {
            // Initialize account 1
            const account1 = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                didServerUrl: CONFIG.DID_SERVER_URL,
                environment: CONFIG.ENVIRONMENT
            })
            did1 = await account1.did()
            await network.connect(account1)
            context = await network.openContext(CONFIG.CONTEXT_NAME, true)

            // Initialize account 3
            const account2 = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY_2,
                didServerUrl: CONFIG.DID_SERVER_URL,
                environment: CONFIG.ENVIRONMENT
            })
            did2 = await account2.did()
            await network2.connect(account2)
            context2 = await network2.openContext(CONFIG.CONTEXT_NAME, true)

            const datastore = await context.openDatastore(DS_CONTACTS)
            const result1 = await datastore.save({'hello': 'world'})
            assert.ok(result1 === false, 'Unable to save due to validation error')

            const contact = {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john@smith.com'
            }

            const result2 = await datastore.save(contact)
            assert.ok(result2, 'Able to save valid data')

            const row = await datastore.get(result2.id)
            assert.ok(row, 'Able to fetch the inserted row')
            assert.ok(row.firstName == contact.firstName, 'Data matches')
        })

        it('can open a datastore with user permissions, as the owner', async function() {
            const datastore = await context.openDatastore(DS_CONTACTS, {
                permissions: {
                    read: 'users',
                    write: 'users'
                }
            })
            const database = await datastore.getDb()
            const info = await database.info()
            DB_USER_ENCRYPTION_KEY = info.encryptionKey

            // Grant read / write access to DID_3 for future tests relating to read / write of user databases
            const updateResponse = await datastore.updateUsers([did2], [did2])

            const contact = {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@doe.com'
            }

            const result = await datastore.save(contact)
            const data = await datastore.get(result.id)

            assert.ok(data.firstName == 'Jane', 'Row has expected value')
        })

        it('can open a datastore with user permissions, as an external user', async function() {
            const datastore = await context2.openExternalDatastore(DS_CONTACTS, did1, {
                permissions: {
                    read: 'users',
                    write: 'users'
                },
                encryptionKey: DB_USER_ENCRYPTION_KEY
            })

            const data = await datastore.getMany()

            assert.ok(data.length, 'Results returned')
        })

        it(`data signatures correctly drop version information from signatures`, async function() {
            const TESTS = [
                ['https://common.schemas.verida.io/social/contact/latest/schema.json', 'https://common.schemas.verida.io/social/contact/schema.json'],
                ['https://common.schemas.verida.io/social/contact/v0.1.0/schema.json', 'https://common.schemas.verida.io/social/contact/schema.json'],
                ['https://common.schemas.verida.io/health/fhir/4.0.1/schema.json', 'https://common.schemas.verida.io/health/fhir/4.0.1/schema.json'],
                ['https://common.schemas.verida.io/health/fhir/4.0.1/Patient/v0.1.0/schema.json', 'https://common.schemas.verida.io/health/fhir/4.0.1/Patient/schema.json'],
            ]

            for (var testId in TESTS) {
                const TEST = TESTS[testId]
                const schemaName = TEST[0]
                const versionlessSchemaName = TEST[1]
                const data = {
                    hello: 'world',
                    test: 'true',
                    schema: schemaName
                }

                const calculatedSig = await RecordSignature.generateSignature(data, {
                    signContext: context
                })

                data.schema = versionlessSchemaName

                const versionlessSig = await RecordSignature.generateSignature(data, {
                    signContext: context
                })

                assert.equal(Object.values(calculatedSig)[0], Object.values(versionlessSig)[0], `Versionless sig for schema "${schemaName}" matches sig for schema "${versionlessSchemaName}"`)
            }
        })
    })

    // @todo need a way to know which users that have access to a particular database

})