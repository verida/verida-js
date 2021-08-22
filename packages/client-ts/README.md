
# verida-ts

## Tests



```
$ nvm use 14
$ ceramic daemon --network inmemory
$ // follow steps in `storage-link/idx/README.md` to create local schemas
$ // update test/config.ts
$ // start datastore server in a new terminal window `cd ../datstore-server; npm run start`
$ yarn run tests
$ yarn run test test/storage.context.tests.ts
```