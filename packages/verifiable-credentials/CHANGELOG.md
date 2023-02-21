
- Fix: Incorrect documentation link

2023-02-16 (v2.1.2)
-------------------

- Remove client-ts dependency

2023-02-16 (v2.1.1)
-------------------

- Support proofStrings
- Support easy creation of a Verida compatible credential record
- Use new @verida/helpers package
- Export interfaces
- Support defining icon of Verida compatible credential record
- Support auto-generating proofs defined in credential schema

2023-02-09 (v2.0.6)
-------------------

- Fix: Correct network explorer URL and make it configurable

2023-02-09 (v2.0.5)
-------------------

- Fix: Update tests to work with Acacia
- Upgrade to latest DID-JWT library (6.11.0)
- Upgrade to latest DID-JWT-VC library (3.1.0)
- Make `resolverConfig` optional when verifying a credential

2023-01-27 (v2.0.4)
-------------------

- Remove engine restriction of Node 14 only

2023-01-24 (v2.0.2)
-------------------

- Upgrade to @verida/types

2023-01-13 (v2.0.0)
-------------------

- Updates to support break changes as part of v2.0.0 release of the protocol

2022-05-27 (v0.1.6)
-------------------

- Update createCredentialJWT method to include `veridaContextName` property in the VC (#185)

2022-04-12 (v0.1.5)
-------------------

- Support verifying a credential without logging in
- Expand and improve unit tests
- Use updated DID resolver

2022-03-10 (v0.1.4)
-------------------

- Changes to support documentation generation
- Feature: Ensure schema is a valid credential schema that expects `didJwtVc` attribute
- Feature: Ensure credential hasn't expired when verifying (relies on local clock being correct)
- Fix: Base64 encode sharing credential public URI's without using an external library
- Feature: Add additional unit tests for new features and ensuring auto-created `issuanceDate` is correctly set

2022-02-27 (v0.1.3)
-------------------

- Feature: Add more complete unit tests
- Feature: Support error logging
- Feature: Support issuing an encrypted public presentation for sharing
- Feature: Support custom expiryDate and issuanceDate
- Feature: Base64 encode Verida URIs for more compact length