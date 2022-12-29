require('dotenv').config();

export function getBlockchainAPIConfiguration() {
  const args = process.argv.slice(2);
  // console.log("ARGS : ", args);
  const testMode : 'gasless' | 'web3' = args.length > 0 && args.includes('gasless') ? 'gasless' : 'web3';
  // args.length > 0 && args[0] === 'direct' ? args[0] : 'gasless';
  console.log('Test mode : ', testMode);

  let configuration = {
    callType: testMode,
    rpcUrl: <string> process.env.RPC_URL,
    web3Options: {
    }
  }

  if (testMode === 'web3') {
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
        throw new Error('No PRIVATE_KEY in the env file');
    }
    const rpcURL = process.env.RPC_URL;
    if (!rpcURL) {
        throw new Error('No RPC_URL in the env file');
    }

    configuration["web3Options"] = {
      // signer?: Signer;
      privateKey,
      // provider?: Provider;
      rpcUrl: rpcURL,
      logPerformance: true
      // web3?: any;
    }
  } else {
    const PORT = process.env.SERVER_PORT ? process.env.SERVER_PORT : 5021;
    const SERVER_URL = `http://localhost:${PORT}`;
    
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
    }
  }

  return configuration;
}