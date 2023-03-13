
- Fix: Force didAddress to lowercase when fetching usernames
- Split unit tests into read v read/write

2023-03-10 (v2.2.0)
-------------------

- Gracefully handle full DID supplied to getUsernames()
- Replace `chainNameorId` with `network` based on `EnvironmentType`
- General code cleanup
- Improve README to explain `read only` v `read and write` mode
- Simplify configuration
- Improve error messages
- Support looking up usernames from the cache
- Update unit tests

2022-03-01 (v2.1.3)
-------------------

- Improve documentation in README.md
- Simplify library usage
- Support auto-detected `readOnly` mode that supports getting DIDs and Usernames, but not writing to the blockchain
- Add username / DID in memory lookup cache

2023-02-09 (v2.0.5)
-------------------

- Initial release