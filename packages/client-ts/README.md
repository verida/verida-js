
# Verida Client (Typescript)

This is the Verida Client (Typescript) library compatible with NodeJs and modern web browsers.

## Usage

Install the client library:

```
yarn install @verida/client-ts
```

In your application, include the dependency and create a new client network instance:

```
import VeridaClient from '@verida/client-ts'

// establish a network connection
const client = new VeridaClient({
    defaultDatabaseServer: {
        type: 'VeridaDatabase',
        endpointUri: 'http://localhost:5000/'
    },
    defaultMessageServer: {
        type: 'VeridaMessage',
        endpointUri: 'http://localhost:5000/'
    },
    ceramicUrl: 'http://localhost:7007'
})

// establish an authorized Ceramic connection for a given Ethereum private key
const ETH_PRIVATE_KEY = '0x...'
ceramic = await utils.createAccount('ethr', ETH_PRIVATE_KEY)

// create a Verida account instance that wraps the authorized Ceramic connection
// The `AutoAccount` instance will automatically sign any consent messages (useful for testing)
const account = new AutoAccount(ceramic)

// Connect the Verida account to the Verida client
await client.connect(account)

// Open an application context
context = await network.openContext(CONFIG.CONTEXT_NAME, true)

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