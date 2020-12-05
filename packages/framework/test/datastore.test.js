'use strict';

const assert = require("assert");
import ds from '..'

describe('datastore', () => {
    it('needs tests', function() {
        const datastore = new ds()
        assert(datastore.hello('world'), 'hello world')
    });
});
