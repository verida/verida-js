

Getting started
------------------

In the root folder, run:

```
yarn install
npx lerna link
cd storage
yarn install
yarn run build
cd ../storage-connection-ethr
yarn install
yarn run build
yarn run test
```

Adding a linked dependency:

Running `yarn add @verida/3id-utils-node` won't work if that package hasn't been published to `npm`.

The solution is to manually add that dependency to `package.json` and then run `npx lerna bootstrap` in the root directory of this project.