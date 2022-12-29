'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'
import { sleep } from '../utils'

const DB_NAME = 'SyncTestDb'

/**
 * 
 */
describe('Verida database connectivity tests', () => {
    let context, did1, database

    const network = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    let eventsTriggered: any = {}
    const eventTypes = ['change', 'paused', 'active', 'canceled', 'denied', 'complete', 'error']

    describe('Manage databases for the authenticated user', function() {
        this.timeout(200000)
        
        it('can listen for sync events', async function() {
            // Initialize account 1
            const account1 = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            did1 = await account1.did()
            await network.connect(account1)
            context = await network.openContext(CONFIG.CONTEXT_NAME, true)
            
            database = await context.openDatabase(DB_NAME)

            // Bind to all sync events
            for (let i in eventTypes) {
                const eventType = eventTypes[i]
                eventsTriggered[eventType] = {
                    triggered: false
                }

                eventsTriggered[eventType].listener = database.onSync(eventType, () => {
                    eventsTriggered[eventType].triggered = true
                })
            }

            // Save a record and then fetch all to trigger active, change, paused events
            await database.save({'hello': 'world'})
            await database.getMany()

            // Timeout for 10 seconds to give events time to fire
            await sleep(10000)

            // Confirm expected events are triggered
            assert.equal(eventsTriggered.active.triggered, true, 'Active event triggered')
            assert.equal(eventsTriggered.change.triggered, true, 'Change event triggered')
            assert.equal(eventsTriggered.paused.triggered, true, 'Paused event triggered')
        })        

        it('can stop triggering events if listener is cancelled', async () => {
            // Set all events as untriggered
            for (let i in eventTypes) {
                const eventType = eventTypes[i]
                eventsTriggered[eventType].triggered = false
            }

            eventsTriggered['change'].listener.cancel()

            // Save a record and then fetch all to trigger active, change, paused events
            await database.save({'hello': 'world'})
            await database.getMany()

            // Timeout for 10 seconds to give events time to fire
            await sleep(10000)

            // Confirm expected events are triggered
            assert.equal(eventsTriggered.change.triggered, false, 'Change event not triggered')
            assert.equal(eventsTriggered.complete.triggered, true, 'Complete event triggered')
        })

        it('can fetch sync info', async () => {
            const info = await database.info()
            assert.ok(info, 'Info returned')
            assert.ok(info.sync, 'Info contains sync info')
            assert.ok(info.sync.pull, 'Info contains sync pull info')
            assert.ok(info.sync.push, 'Info contains sync push info')
        })
    })

    after(async () => {
        await context.close()
    })

})