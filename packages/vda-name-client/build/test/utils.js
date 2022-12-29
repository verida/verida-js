"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockchainAPIConfiguration = exports.sleep = void 0;
require('dotenv').config();
function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
exports.sleep = sleep;
function getBlockchainAPIConfiguration() {
    var args = process.argv.slice(2);
    // console.log("ARGS : ", args);
    var testMode = args.length > 0 && args.includes('gasless') ? 'gasless' : 'web3';
    // args.length > 0 && args[0] === 'direct' ? args[0] : 'gasless';
    console.log('Test mode : ', testMode);
    var configuration = {
        callType: testMode,
        rpcUrl: process.env.RPC_URL,
        web3Options: {}
    };
    if (testMode === 'web3') {
        var privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('No PRIVATE_KEY in the env file');
        }
        var rpcURL = process.env.RPC_URL;
        if (!rpcURL) {
            throw new Error('No RPC_URL in the env file');
        }
        configuration["web3Options"] = {
            // signer?: Signer;
            privateKey: privateKey,
            // provider?: Provider;
            rpcUrl: rpcURL,
            logPerformance: true
            // web3?: any;
        };
    }
    else {
        var PORT = process.env.SERVER_PORT ? process.env.SERVER_PORT : 5021;
        var SERVER_URL = "http://localhost:".concat(PORT);
        configuration["web3Options"] = {
            serverConfig: {
                headers: {
                    'context-name': 'Verida Test',
                },
            },
            postConfig: {
                headers: {
                    'user-agent': 'Verida-Vault',
                },
            },
            endpointUrl: SERVER_URL,
        };
    }
    return configuration;
}
exports.getBlockchainAPIConfiguration = getBlockchainAPIConfiguration;
//# sourceMappingURL=utils.js.map