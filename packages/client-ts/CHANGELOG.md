
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