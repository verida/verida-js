
2022-05-27 (v1.1.15)
-------------------

- Add more top level exports; Database, Datastore, Profile, Schema (#205)
- Support a fallback context to search when opening a public profile (#203 #194)
- Support auto-login from URL parameters to support URL redirection from the Vault (#199)
- Return empty array if no results from database when calling `getMany()` (#193)
- Add mocha types to resulve unit test errors
- Fix incorrect typing of `DatabaseOpenConfig` encryptionKey

2022-04-12 (v1.1.14)
-------------------

- Improve typing

2022-03-10 (v1.1.13)
-------------------

- Changes to support documentation generation

2022-02-27 (v1.1.12)
-------------------

- Fix: Ensure email validation works correctly
- Fix: Strip trailing slash if it exists on an endpointUrl
- Fix: Pinging notification server pre-release bugs
- Feature: Implement versionless schema signatures
- Feature: Support opening an external context with a context hash OR a context name
- Fix: Unit test missing permission config

2021-11-22 (v1.1.9)
-------------------

- Fix: User with read, but not write access could write to the local database (but not remote). Now a permission denied exception is thrown.

2021-11-15 (v1.1.8)
-------------------

- Fix did-jwt version to be locked in to currently supported version


2021-11-14 (v1.1.7)
-------------------

- Fix DID of current account not being included in the config to databaseEngine.openDatabase when opening an external database

2021-11-13 (v1.1.6)
-------------------

- Update @verida/account to latest

2021-11-13 (v1.1.5)
-------------------

- Fix public profiles defaulting to incorrect profile name
- Fix API documentation generation

2021-11-09 (v1.1.4)
-------------------

- Update code base to use new schema URLs (core, common, vault)
- Update schemas to expect `draft-2020-12` JSON schemas (uses latest AJV version 8)

2021-10-27 (v1.1.0)
-------------------

- Large refactor to use [Verida DID Server](https://github.com/verida/did-server) and Ethereum compatible key structure

2021-10-08 (v1.0.8)
-------------------

- Fix critical issue with public databases being added to local database registry

2021-10-08 (v1.0.7)
-------------------

- Fix issue with build not created correctly

2021-10-07 (v1.0.6)
-------------------

- Fix critical, non backwards compatible, issue where DID was being forced to upper case resulting in incorrect database hash's being created
- Fix typo in public database error message 
- Fix typo in `database.info()` responses
- Create a registry of all known databases within a context
- Update axios to address security vulnerability

2021-10-06 (v1.0.5)
-------------------

- Fix issue with build not created correctly

2021-10-06 (v1.0.4)
-------------------

- Fix issue with database event listeners

2021-10-04 (v1.0.3)
-------------------

- Decrease `pbkdf2` iterations to `1000` so its viable in react native (was slow on physical devices)

2021-09-22 (v1.0.1)
-------------------

- Fix cross context database access
- Fix inbox messaging
- Add missing `uiid` dependency
- Improve tests to use `LimitedAccount`