
## Creating schema in Ceramic

Quick hack instructions to create the necessary schema

- [https://developers.idx.xyz/guides/cli/](Install Ceramic and IDX)
- Copy the `schema.json` file (SecureContexts.schema.json) from this folder
- Use this online [https://www.freeformatter.com/json-formatter.html#ad-output](JSON formatter tool) to generate a single line string representing the JSON schema
- See [https://developers.idx.xyz/guides/definitions/creating/](IDX create definitions guide)


## Example

Publish a schema:

```
$ idx schema:publish did:key:z6MkfPM7WbUpnQZyaxLevGCMkcGz3MYMaraqsRZKAGstVANa '{"$schema":"http://json-schema.org/draft-07/schema","title":"SecureStorageContexts","type":"object","properties":{"contexts":{"type":"array","title":"context","items":{"type":"object","title":"Secure Storage Context","properties":{"id":{"type":"string","title":"ID"},"publicKeys":{"type":"object","title":"Public keys","properties":{"asymKey":{"$ref":"#/definitions/SecureContextPublicKey","title":"Asymmetric key"},"signKey":{"$ref":"#/definitions/SecureContextPublicKey","title":"Signing key"}},"required":["asymKey","signKey"]},"services":{"type":"object","title":"Services","properties":{"storageServer":{"$ref":"#/definitions/SecureStorageServer","title":"Storage server"},"messageServer":{"$ref":"#/definitions/SecureStorageServer","title":"Message server"}},"required":["storageServer","messageServer"]}},"required":["id","publicKeys","services"]}}},"required":["contexts"],"definitions":{"SecureContextPublicKey":{"properties":{"type":{"type":"string","title":"Key type","minLength":2,"maxLength":255},"base58":{"type":"string","title":"Base58 representation of the key","maxLength":44,"minLength":44,"pattern":"^[1-9A-HJ-NP-Za-km-z]{44}$"}}},"SecureStorageServer":{"properties":{"type":{"type":"string","title":"Storage type","minLength":2,"maxLength":20},"endpointUri":{"type":"string","title":"Endpoint URI"}}}}}'
```

Create a definition linked to the schema:

```
idx definition:create did:key:z6MkfPM7WbUpnQZyaxLevGCMkcGz3MYMaraqsRZKAGstVANa --name="SecureContexts" --description="Verida Secure Contexts" --schema=ceramic://k3y52l7qbv1frygi424x7j9e2wiza45vj1u32rwllfyon0mk1sctvo9qo4ci3lon4
```

This will return a definition ID that can be used directly or added to Ceramic configuration in the SDK with an alias.

