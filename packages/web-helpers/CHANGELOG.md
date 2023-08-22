2023-xx-xx (v3.0.0)
-------------------

## Breaking Changes

- Refactoring of `WebUser`:
  - `getClient`, `getContext`, `getAccount`, `getDid` and `isConnected` are no longer asynchronous, they return their respective output directly
  - `isConnected` doesn't automatically connect if there's an existing session, use `autoConnectExistingSession` instead for tist specific purpose.

## Bug Fixes

- Fix `WebUser` using previous Identity profile after disconnecting and connecting with a different one.

2023-04-20 (v2.3.0)
-------------------

- Update to latest protocol dependencies

2023-02-09 (v2.0.5)
-------------------

- First release (migrated `WebUser` from `account-web-vault`)
