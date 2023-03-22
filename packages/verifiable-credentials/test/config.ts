import { AccountNodeDIDClientConfig, EnvironmentType } from '@verida/types'
require('dotenv').config();

const ENDPOINTS = ['https://node1-apse2.devnet.verida.tech:443/', 'https://node2-apse2.devnet.verida.tech:443/', 'https://node3-apse2.devnet.verida.tech:443/']

const DID_ENDPOINTS: string[] = []
for (let e in ENDPOINTS) {
    DID_ENDPOINTS.push(`${ENDPOINTS[e]}did/`)
}

export default {
    VDA_PRIVATE_KEY_1:   '0x20d3b996ec98a9a536efdffbae10e5eaaf11a765a587483c69195c9460165d38',
    VDA_PRIVATE_KEY_2: '0x20d3b996ec98a9a536efdffbae10f5eaaf11a765a587483c69195c9460165d38',
    ISSUER_NAME: "John Doe",
    ISSUER_DID: 'did:vda:testnet:0x20d3b996ec98a9a536efdffbae10e5eaaf11a765a587483c69195c9460165d38',
    SUBJECT_DID: 'did:vda:testnet:0x20d3b996ec98a9a536efdffbae10f5eaaf11a765a587483c69195c9460165d38',
    ADDRESS_1: '0xB3729982A2585544FD72c99CF3773a9c6baBD55c',
    SCHEMA_SBT: 'https://common.schemas.verida.io/token/sbt/credential/v0.1.0/schema.json',
    DEFAULT_ENDPOINTS: {
        defaultDatabaseServer: {
            type: 'VeridaDatabase',
            endpointUri: ENDPOINTS
        },
        defaultMessageServer: {
            type: 'VeridaMessage',
            endpointUri: ENDPOINTS
        },
    },
    CREDENTIAL_DATA: {
        did: 'did:vda:testnet:0x20d3b996ec98a9a536efdffbae10f5eaaf11a765a587483c69195c9460165d38',
        didAddress: '0x20d3b996ec98a9a536efdffbae10f5eaaf11a765a587483c69195c9460165d38',
        name: 'Test credential',
        type: 'test',
        description: `Description goes here`,
        uniqueAttribute: '123',
    },
    DID_CLIENT_CONFIG: <AccountNodeDIDClientConfig> {
        callType: 'web3',
        network: EnvironmentType.TESTNET,
        web3Config: {
            privateKey: process.env.PRIVATE_KEY,
            rpcUrl: 'https://rpc-mumbai.maticvigil.com/'
        },
        didEndpoints: DID_ENDPOINTS
    },
    INVALID_CREDENTIAL_DATA: {
        email: 'me',
        schema: 'https://common.schemas.verida.io/social/contact/v0.1.0/schema.json'
    },
    VERIDA_CONTEXT_NAME: "Verida: Credentials",
    VERIDA_EXPECTED_DATABASE: 'credential_public_encrypted',
    VERIDA_TESTNET_DEFAULT_SERVER: "https://db.testnet.verida.io:5002/",
    INVALID_VERIDA_URI: `verida://did:vda:testnet:0xB3729982A2585544FD72c99CF3773a9c6baBD55c/0x42406d644c8e884be0f76ee05539cfba03eda65baa2bda33ecd364ce4d18047c/credential_public_encrypted/6273bb80-596a-1331ec-ad0d-f3b4d6aec150?key=1f52db207c48b6c54f6692cb182c41bc3bd0805d0efdc9dcb25f15ade8639d5f`,
    EXISTING_CREDENTIAL_URI: `verida://did:vda:testnet:0x0eB0FeD3Fc4f29303fF462fA789E417936E21eee/GpNDePvWU4RQud9jaZJiNwFyAS/credential_public_encrypted/28916130-4b70-11ed-b782-b5bccbc8755f?key=24104769d8815432029f533bc7dd0872d930955d23f21c27537a9e5297f5baeb`,
    RAW_CREDENTIAL_DATA: {
        schema: 'https://common.schemas.verida.io/social/contact/v0.1.0/schema.json',
        didJwtVc: 'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJkaWQ6dmRhOnRlc3RuZXQ6MHg2YTY0NzJhNDRGODQ0Njg3NGMyOGI2MjgwQTA1Qjc2NzA0RDQwMjIwIiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiY3JlZGVudGlhbFNjaGVtYSI6eyJpZCI6Imh0dHBzOi8vY29tbW9uLnNjaGVtYXMudmVyaWRhLmlvL3Rva2VuL3NidC9jcmVkZW50aWFsL3YwLjEuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJjcmVkZW50aWFsU3ViamVjdCI6eyJkZXNjcmlwdGlvbiI6IkRlc2NyaXB0aW9uIGdvZXMgaGVyZSIsImRpZCI6ImRpZDp2ZGE6dGVzdG5ldDoweDIwZDNiOTk2ZWM5OGE5YTUzNmVmZGZmYmFlMTBmNWVhYWYxMWE3NjVhNTg3NDgzYzY5MTk1Yzk0NjAxNjVkMzgiLCJkaWRBZGRyZXNzIjoiMHgyMGQzYjk5NmVjOThhOWE1MzZlZmRmZmJhZTEwZjVlYWFmMTFhNzY1YTU4NzQ4M2M2OTE5NWM5NDYwMTY1ZDM4IiwibmFtZSI6IlRlc3QgY3JlZGVudGlhbCIsInR5cGUiOiJ0ZXN0IiwidW5pcXVlQXR0cmlidXRlIjoiMTIzIn0sImlzc3VhbmNlRGF0ZSI6IjIwMjMtMDMtMTBUMDc6MDQ6MzIuNzEzWiIsImlzc3VlciI6ImRpZDp2ZGE6dGVzdG5ldDoweDZhNjQ3MmE0NEY4NDQ2ODc0YzI4YjYyODBBMDVCNzY3MDRENDAyMjAiLCJwcm9vZnMiOnsidHlwZS1kaWRBZGRyZXNzIjoiMHg4ZjNiMDQxYjE5MDIzOWY4ZmRhYjA2ZDcyYjMwOWQ5ZDRiNTY5NzI5MjY1ZGM1ZWM4YmFiOTUxYTFjMzAxMDFhNzg4NWZjNmQ1ZTQ4NmE5ZGZkODE1MmM1NjJlODQyYzhiZGRhYjRkNmIxYjVmMDU4YWM3NmQzY2YyYjhjZTE1ZDFjIiwidHlwZS11bmlxdWUiOiIweDhiNGE0MmYwYWQxZTUxYmFlYzgzNTZlZThmMTNkYjQzZjI4ZDMxMDhmMTlmMjk1NWI1OGJhMWQ5YzNmYzgzZWU2ZWM4ZDVjYmNkMTAwNDMyMDNhOGE3Njc1ZjZjOWI1OWQ0NTdjNTkxMDkzMTU4OTYwZThmZTNjZTI3OGJlYzliMWMiLCJ0eXBlLXVuaXF1ZS1kaWRBZGRyZXNzIjoiMHgzZmRkNDUyZTYxZGVmN2FkYjFjNTljNTBkMDBkM2E5NmFjMWI0M2I4M2M5YzMyOWE3NTkwMjFkNjNlOTY1NmMxNzc4MGVlYWJhZTcwMzVkYmEyNDk4NzAzOTczNGZjMWFhYjNjOGE2YzRjMGNmMmQ4ODAxOTNjY2IwYzQ4ZTk1YjFjIn0sInN1YiI6ImRpZDp2ZGE6dGVzdG5ldDoweDIwZDNiOTk2ZWM5OGE5YTUzNmVmZGZmYmFlMTBmNWVhYWYxMWE3NjVhNTg3NDgzYzY5MTk1Yzk0NjAxNjVkMzgiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sInZlcmlkYUNvbnRleHROYW1lIjoiVmVyaWRhOiBDcmVkZW50aWFscyJ9fQ.eDB9YEM9LtQ8rHQCvGCqoOyZISoUEQP092qs3yWa0b5oqdcoyong6QpNLirRWoDYL_IVfxs5RUm4XKbjpy2igA'
    },
    CREDENTIAL_DATA_PAYLOAD: {
        fullName: "Jane Doe",
        dateOfBirth: "1992-07-03",
        patientId: "ABC123",
        testTimestamp: "2022-03-01T10:30:05.435Z",
        result: "Negative",
        schema: "https://common.schemas.verida.io/health/pathology/tests/covid19/pcr/v0.1.0/schema.json"
    },
}