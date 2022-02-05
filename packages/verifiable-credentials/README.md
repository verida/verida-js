## Verifiable Credential

Our `@verida/verifiable-credentials` packages enables you Create and verify W3C Verifiable Credentials in JWT format which be shared and across application that integrates to our verida protocol. this package leverages the `did-jwt` and `did-jwt-vc` under to th hood.

### Issue encrypted credential

See the below code examples to issue an encrypted credential it will return a URI which can be verify by the connected did account

#### prerequisites:

You will have to authenticate a user to your application to create `context` for the logged in user .

There are two ways this can be done :

1. using our see: [Single Sign on SDK](https://www.notion.so/sso-sdk)

2. Using our see: [Account Node Package](https://www.notion.so/verida/Authentication-ee83c8ec29224752a6f60a7ca7452ba6)

```js
import { SharingCredential, Credentials } from '@verida/verifiable-credentials';

const app = context;

const shareCredential = new SharingCredential(context);
const credential = new Credentials(app);

const item = await credential.createCredentialJWT(credentialData);

const data = await shareCredential.issueEncryptedCredential(item);
```

### Verify a credential

See the below code examples to verify an encrypted credentialURI in order to retrieve credential data

```js
import { Credentials } from '@verida/verifiable-credentials';
import { Utils } from '@verida/client-ts';

const app = context;

const credential = new Credentials(context);

const jwt = await Utils.fetchCredentialURI(encryptedData.uri, context);

const verifiedCredential: any = await credential.verifyCredential(jwt);
```
