
## Creating schema in Ceramic

Quick hack instructions to create the necessary schema

- [https://developers.idx.xyz/guides/cli/](Install Ceramic and IDX)
- Copy the `schema.json` file (SecureContexts.schema.json) from this folder
- Use this online [https://www.freeformatter.com/json-formatter.html#ad-output](JSON formatter tool) to generate a single line string representing the JSON schema
- See [https://developers.idx.xyz/guides/definitions/creating/](IDX create definitions guide)


## Example

Publish a schema:

```
$ idx schema:publish did:key:z6MkfPM7WbUpnQZyaxLevGCMkcGz3MYMaraqsRZKAGstVANa '{"$schema":"http://json-schema.org/draft-07/schema","title":"SecureContexts","type":"object","properties":{"contexts":{"type":"array","title":"context","items":{"type":"object","title":"SecureContext","properties":{"id":{"type":"string","title":"ID"},"publicKeys":{"type":"object","title":"Public keys","properties":{"asymKey":{"$ref":"#/definitions/SecureContextPublicKey","title":"Asymmetric key"},"signKey":{"$ref":"#/definitions/SecureContextPublicKey","title":"Signing key"}},"required":["asymKey","signKey"]},"services":{"type":"object","title":"Services","properties":{"storageEndpoint":{"type":"string","title":"Storage endpoint"},"messageEndpoint":{"type":"string","title":"Message endpoint"}},"required":["storageEndpoint","messageEndpoint"]}},"required":["id","publicKeys","services"]}}},"required":["contexts"],"definitions":{"SecureContextPublicKey":{"properties":{"type":{"type":"string","title":"Key"},"base58":{"type":"string","title":"Base58 representation of the key"}}}}}'
```

Create a definition linked to the schema:

```
idx definition:create did:key:z6MkfPM7WbUpnQZyaxLevGCMkcGz3MYMaraqsRZKAGstVANa --schema=ceramic://k3y52l7qbv1frybcpa74s7anv2o6omxw17qw1h7hr1dp7uqwort2182z5g4sumv40 --name="SecureContexts" --description="Verida Secure Contexts"
```

This will return a definition ID that can be used directly or added to Ceramic configuration in the SDK with an alias.