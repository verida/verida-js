
## Creating schema in Ceramic

Quick hack instructions to create the necessary schema

- [https://developers.idx.xyz/guides/cli/](Install Ceramic and IDX)
- Copy the `schema.json` file (SecureContexts.schema.json) from this folder
- Use this online [https://www.freeformatter.com/json-formatter.html#ad-output](JSON formatter tool) to generate a single line string representing the JSON schema
- See [https://developers.idx.xyz/guides/definitions/creating/](IDX create definitions guide)


## Example

Specify the Ceramic URL to use. Use localhost if running a local ceramic instance. The Ceramic testnet is `https://ceramic-clay.3boxlabs.com` which already has the Verida schema deployed.

```
$ export CERAMIC_URL=http://localhost:7007/
$ idx config:set ceramic-url $CERAMIC_URL
$ idx config:get ceramic-url
```

Create a DID for IDX:

```
$ idx did:create --label=me
```

Publish a schema:

```
$ idx schema:publish did:key:z6MkfPM7WbUpnQZyaxLevGCMkcGz3MYMaraqsRZKAGstVANa '{"$schema":"http://json-schema.org/draft-07/schema","title":"SecureContexts","type":"object","properties":{"contexts":{"type":"array","title":"context","items":{"type":"object","title":"Secure Context","properties":{"id":{"type":"string","title":"ID"},"publicKeys":{"type":"object","title":"Public keys","properties":{"asymKey":{"$ref":"#/definitions/SecureContextPublicKey","title":"Asymmetric key"},"signKey":{"$ref":"#/definitions/SecureContextPublicKey","title":"Signing key"}},"required":["asymKey","signKey"]},"services":{"type":"object","title":"Services","properties":{"databaseServer":{"$ref":"#/definitions/SecureContextEndpoint","title":"Database server"},"storageServer":{"$ref":"#/definitions/SecureContextEndpoint","title":"Storage server"},"messageServer":{"$ref":"#/definitions/SecureContextEndpoint","title":"Message server"}},"required":["databaseServer","messageServer"]}},"required":["id","publicKeys","services"]}}},"required":["contexts"],"definitions":{"SecureContextPublicKey":{"properties":{"type":{"type":"string","title":"Key type","minLength":2,"maxLength":255},"base58":{"type":"string","title":"Base58 representation of the key","maxLength":44,"minLength":43,"pattern":"^[1-9A-HJ-NP-Za-km-z]{43,44}$"}}},"SecureContextEndpoint":{"properties":{"type":{"type":"string","title":"Storage type","minLength":2,"maxLength":20},"endpointUri":{"type":"string","title":"Endpoint URI"}}}}}'
```

Create a definition linked to the schema:

```
idx definition:create did:key:z6MkfPM7WbUpnQZyaxLevGCMkcGz3MYMaraqsRZKAGstVANa --name="SecureContexts" --description="Verida Secure Contexts" --schema=ceramic://k3y52l7qbv1frxyrywm26hkzy9ykuk0ade0fedontx9xdf50bloazc3hkikh61h4w
```

This will return a definition ID that can be used directly or added to Ceramic configuration in the SDK with an alias.

Latest definition ID created on ceramic clay testnet 2021-08-29 `kjzl6cwe1jw145l8jya7g6cuyluj17xlyc6t7p6iif12isbi1ppu5cuze4u3njc`