2022-02-09 (v2.0.5)
-------------------

- Fix: User cancelled model, threw an exception when it should only return false.

2022-01-27 (v2.0.4)
-------------------

- Remove engine restriction of Node 14 only

2022-01-25 (v2.0.3)
-------------------

- Migrate from static to instance class

2022-01-24 (v2.0.2)
-------------------

- Upgrade to @verida/types

2022-01-17 (v2.0.1)
-------------------

- Fix: Remove modal hidden HTML tag
- Fix: Better endpoint error messages
- Fix: Not handling authentication when accessToken is not invalid.


2022-01-13 (v2.0.0)
-------------------

- Support wallet connect configuration
- Support ignoring an existing session
- Support updated account dependencies
- Support multiple endpoints for contexts
- Support getting auth context directly

2022-05-27 (v1.1.12)
-------------------

- Support auto-login from URL parameters to support URL redirection from the Vault (#199)

2022-04-12 (v1.1.11)
-------------------

- Make clear how logoUrl is configured via the `VaultAccountRequest` definition

2022-03-10 (v1.1.10)
-------------------

- Changes to support documentation generation
 
2022-02-27 (v1.1.9)
-------------------

- Feature: Simplify the network connection configuration so default endpoints don't need to be specified

2022-01-24 (v1.1.8)
-------------------

- Update @verida/account-web-vault changed verida default image
- Update @verida/account-web-vault updated README.md

2021-11-13 (v1.1.5)
-------------------

- Update @verida/account to latest

2021-10-08 (v1.0.5)
-------------------

- Fix issue with build not created correctly

2021-10-07 (v1.0.4)
-------------------

- Improve mobile UX to open app immediately
- Add `hasSession` helper so apps can detect if a user is already logged in

2021-09-22 (v1.0.1)
-------------------

- Make serverUri and callback function optional in `VaultModalLoginConfig`