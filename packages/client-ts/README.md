
# Verida Client (Typescript)

This is the Verida Client (Typescript) library compatible with NodeJs and modern web browsers.

## Usage

Install the client library:

```
yarn install @verida/client-ts
```

### Context Initializing (Web - SSO)

Initialize a connection to the Verida netork using a private key stored on the user's mobile device using the Verida Vault.

This easy to use integration method allows a user to scan a QR code to sign into your application. If the user doesn't have the Verida Vault installed, they will be prompted to install it. Existing users will be prompted to authorize your application to access encrypted storage for that application.

```
import { Network } from '@verida/client-ts'
import { VaultAccount } from '@verida/account-web-vault'

const CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com'

const account = new VaultAccount({
    defaultDatabaseServer: {
        type: 'VeridaDatabase',
        endpointUri: 'http://localhost:5000/'
    },
    defaultMessageServer: {
        type: 'VeridaMessage',
        endpointUri: 'http://localhost:5000/'
    },
})

    return Network.connect({
    client: {
        defaultDatabaseServer: {
            type: 'VeridaDatabase',
            endpointUri: 'http://localhost:5000/'
        },
        defaultMessageServer: {
            type: 'VeridaMessage',
            endpointUri: 'http://localhost:5000/'
        },
        ceramicUrl: CERAMIC_URL
    },
    account: account,
    context: {
        name: CONTEXT_NAME
    }
})
```

### Context Initializing (Server / Mobile)

Initialize a connection to the Verida network with an existing private key.

In this example we are providing default Verida servers pointing to `http://localhost:5000/`. These will need to point to any default server infrastructure you provide to your users by spinning up instances of `@verida/storage-node`.

const CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com'
const CONTEXT_NAME = 'My Application Context Name'

```
import { Network } from '@verida/client-ts'
import { AutoAccount } from '@verida/account-node'
  
const context = Network.connect({
    context: {
        name: CONTEXT_NAME
    },
    client: {
        defaultDatabaseServer: {
            type: 'VeridaDatabase',
            endpointUri: 'http://localhost:5000/'
        },
        defaultMessageServer: {
            type: 'VeridaMessage',
            endpointUri: 'http://localhost:5000/'
        }
    },
    account: new AutoAccount("ethr", '0x...')
})

```

### Context Initializing (Web - Ceramic)

See `@verida/account-3id-connect`. Do not use, for testing / demonstration purposes only. See README.md in the package.

### Advanced Initializing

In your application, include the dependency and create a new client network instance:

```
import Client from '@verida/client-ts'
import { AutoAccount } from '@verida/account-node'

const CONTEXT_NAME = 'My Application Context Name'
const CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com'

// establish a network connection
const client = new Client({
    defaultDatabaseServer: {
        type: 'VeridaDatabase',
        endpointUri: 'http://localhost:5000/'
    },
    defaultMessageServer: {
        type: 'VeridaMessage',
        endpointUri: 'http://localhost:5000/'
    },
    ceramicUrl: CERAMIC_URL
})

// create a Verida account instance that wraps the authorized Ceramic connection
// The `AutoAccount` instance will automatically sign any consent messages
const account = new AutoAccount('ethr', CONFIG.ETH_PRIVATE_KEY, CERAMIC_URL)

// Connect the Verida account to the Verida client
await client.connect(account)

// Open an application context (forcing creation of a new context if it doesn't already exist)
const context = await client.openContext(CONTEXT_NAME, true)

// Open a database
const database = await context.openDatabase('my_database')
```

See documentation for full details

## Tests

There are unit tests available in the `tests/` folder.

### Setting up test environment

**Ceramic Network (run locally)**

The tests require running a local instance of the Ceramic network to support creating valid DID's.

Ceramic currently requires NodeJs v14 and can be initialised with:

```
$ nvm use 14
$ ceramic daemon --network inmemory
```

**Install Verida Schema (on local Ceramic instance)**

You must install the Verida schema for linking application contexts to a DID. Follow the steps in [packages/storage-link/idx/README.md](storage-link/idx/README.md) to create the schema in your local Ceramic environment. Creating the schema will generate a unique string representing the schema which needs to be updated in `test/config.ts` (STORAGE_LINK_SCHEMA).

**Start the datastore server**

You must run the [Datastore server](https://github.com/verida/datastore-server) locally so there is a CouchDB instance for your test data.

Run the following in a new terminal within the `datastore-server` directory:

```
$ npm install
$ npm run start
```

**Running tests**

You can now run tests from within the `client-ts` directory:

```
$ yarn run tests        // run all tests
$ yarn run test test/storage.context.tests.ts       // run a specific test
```

## Development within a Web Environment

These instructions build this `client-ts` package in the mono repo and allow it type be linked to another typescript web application (such as `@verida/web-sandbox`).

```
$ cd packages/client-ts
$ yarn install
$ yarn build
$ npm link
```

Within an existing typescript web project:

```
$ npm link @verida/client-ts
$ npm run serve
```