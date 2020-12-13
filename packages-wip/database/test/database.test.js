'use strict';

const assert = require("assert");
import VeridaDatabase from '..'
import { PermissionOptionsEnum } from '../src/interfaces

const DID = 'did:ethr:0xeb8df5734aefd6ee43b0649b1f7b956d9f48fa98'
const VAULT_NAME = 'myTestVault'
const DB_NAME = 'myTestDb'

describe('Database', () => {
    it('needs tests', async function() {
        const config = {
            dsn: `verida://${DID}/${VAULT_NAME}/${DB_NAME}`,
            permissions: {
                read: PermissionOptionsEnum.OWNER,
                write: PermissionOptionsEnum.OWNER
            },
            readOnly: false,
            signData: true
        }

        const database = new VeridaDatabase(config)
        const results = await database.getMany()
        assert(results.length, 0)
    });
});
