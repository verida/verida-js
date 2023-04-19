const assert = require('assert')
import { EnvironmentType } from "@verida/types"
import { NodeSelector, StorageNode } from "../src/index"
import { TEST_NODES } from "./testdata"

describe('Storage node selector tests', () => {

    describe('Basic tests - with test data', function () {
        this.timeout(10000)
        let nodeSelector

        this.beforeAll(async () => {
            nodeSelector = new NodeSelector({
                network: EnvironmentType.DEVNET,
                notificationEndpoints: [],
                defaultTimeout: 5000
            })

            nodeSelector.loadStorageNodes(TEST_NODES)
        })

        it('can select nodes by country', async function () {
            const nodes = await nodeSelector.selectNodesByCountry('CH', 1)
            console.log(nodes)
            assert.ok(nodes, 'Nodes were returned')
            assert.equal(nodes.length, 1, '1 node returned')

            const nodes2 = await nodeSelector.selectNodesByCountry('CH', 3)
            assert.ok(nodes2, 'Nodes were returned')
            assert.equal(nodes2.length, 3, '3 nodes returned')
        })

        it('can select nodes by country with region fallback', async function () {
            const nodes = await nodeSelector.selectNodesByCountry('GB', 1)
            assert.ok(nodes, 'Nodes were returned')
            assert.equal(nodes.length, 1, '1 node returned')

            const nodes2 = await nodeSelector.selectNodesByCountry('GB', 3)
            assert.ok(nodes2, 'Nodes were returned')
            assert.equal(nodes2.length, 3, '3 nodes returned')
        })

        it('can select nodes by country with region fallback to global', async function () {
            const nodes = await nodeSelector.selectNodesByCountry('AU', 1)
            assert.ok(nodes, 'Nodes were returned')
            assert.equal(nodes.length, 1, '1 node returned')

            const nodes2 = await nodeSelector.selectNodesByCountry('AU', 3)
            assert.ok(nodes2, 'Nodes were returned')
            assert.equal(nodes2.length, 3, '3 nodes returned')
        })

        it('can select global nodes', async function () {
            const nodes = await nodeSelector.selectNodesByCountry(undefined, 1)
            assert.ok(nodes, 'Nodes were returned')
            assert.equal(nodes.length, 1, '1 node returned')

            const nodes2 = await nodeSelector.selectNodesByCountry(undefined, 3)
            assert.ok(nodes2, 'Nodes were returned')
            assert.equal(nodes2.length, 3, '3 nodes returned')
        })

        // @todo ensure ignore nodes
    })

    describe('Basic tests - with devnet data', function () {
        this.timeout(10000)
        let nodeSelector

        this.beforeAll(async () => {
            nodeSelector = new NodeSelector({
                network: EnvironmentType.DEVNET,
                notificationEndpoints: [],
                defaultTimeout: 5000
            })
        })

        it('can select nodes by country', async function () {
            const nodes = await nodeSelector.selectNodesByCountry('CH', 1)
            assert.ok(nodes, 'Nodes were returned')
            assert.equal(nodes.length, 1, '1 node returned')

            const nodes2 = await nodeSelector.selectNodesByCountry('CH', 3)
            assert.ok(nodes2, 'Nodes were returned')
            assert.equal(nodes2.length, 3, '3 nodes returned')
        })

        it('can select nodes by country with region fallback', async function () {
            const nodes = await nodeSelector.selectNodesByCountry('GB', 1)
            assert.ok(nodes, 'Nodes were returned')
            assert.equal(nodes.length, 1, '1 node returned')

            const nodes2 = await nodeSelector.selectNodesByCountry('GB', 3)
            assert.ok(nodes2, 'Nodes were returned')
            assert.equal(nodes2.length, 3, '3 nodes returned')
        })

        it('can select nodes by country with region fallback to global', async function () {
            const nodes = await nodeSelector.selectNodesByCountry('AU', 1)
            assert.ok(nodes, 'Nodes were returned')
            assert.equal(nodes.length, 1, '1 node returned')

            const nodes2 = await nodeSelector.selectNodesByCountry('AU', 3)
            assert.ok(nodes2, 'Nodes were returned')
            assert.equal(nodes2.length, 3, '3 nodes returned')
        })

        it('can select global nodes', async function () {
            const nodes = await nodeSelector.selectNodesByCountry(undefined, 1)
            assert.ok(nodes, 'Nodes were returned')
            assert.equal(nodes.length, 1, '1 node returned')

            const nodes2 = await nodeSelector.selectNodesByCountry(undefined, 3)
            assert.ok(nodes2, 'Nodes were returned')
            assert.equal(nodes2.length, 3, '3 nodes returned')
        })

        // @todo ensure ignore nodes
    })
})
