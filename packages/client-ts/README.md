
# Verida Client (Typescript)

This is the Verida Client (Typescript) library compatible with NodeJs and modern web browsers.

See [@verida/client-rn](https://github.com/verida/client-rn) for a React Native version of this library.

## Usage

Install the library:

```
yarn add @verida/client-ts
```

### Context Initializing (Web - SSO)

See the [Client SDK Getting Started Guide](https://developers.verida.io/docs/client-sdk/getting-started) in the [Developer Docs](https://developers.verida.io/docs/client-sdk). 


### Context Initializing (Server / Mobile)

Initialize a connection to the Verida network with an existing private key.

See the [Authentication with a Private Key](https://developers.verida.io/docs/client-sdk/authentication#2-private-key).


### Advanced Initializing

See the [Advanced Authentication](https://developers.verida.io/docs/client-sdk/authentication#2-private-key).


## Tests

There are unit tests available in the `tests/` folder.

```
$ yarn run tests
$ yarn run tests test/<testname>.ts
```

### Setting up test environment

**Verida DID Server (run locally)**

The tests require running a local instance of the Verida DID server to support managing DIDs.

See [@verida/did-server](https://github.com/verida/did-server)

**Start a storage node server**

You must run the [Datastore server](https://github.com/verida/storage- node) locally so there is a CouchDB instance for your test data.

Run the following in a new terminal within the `storage-node` directory:

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
$ yarn link
```

Within an existing typescript web project:

```
$ yarn link @verida/client-ts
$ yarn run serve
```

# Generating API docs

```
yarn generate-api-docs
```