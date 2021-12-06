// https://nodejs.org/api/assert.html
const assert = require("assert")
import Credentials from "../src/credentials"

describe("Credential tests", function() {

    this.beforeAll(function() {
        //
    })

    describe("Test", function() {
        it("echo works", async function() {
            const response = Credentials.echo('hello world')
            assert.equal(response, 'hello world', 'String matches expected value')
        })
    })

})