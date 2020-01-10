/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like truffle-hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

 "use strict";
 const ApiKey = require('./network_keys/api/infura');
 const Infura = {
     Mainnet: "https://mainnet.infura.io/" + ApiKey,
     Ropsten: "https://ropsten.infura.io/" + ApiKey,
     Rinkeby: "https://rinkeby.infura.io/" + ApiKey,
     Kovan: "https://kovan.infura.io/" + ApiKey
 }
 const Web3 = require("web3");
 const Provider = require('truffle-privatekey-provider');
 const Wallets = require('./network_keys/private/wallets');
 const web3 = new Web3(null);

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    rinkeby: {
            network_id: 4,
            provider: () => new Provider(Wallets.Rinkeby, Infura.Rinkeby),
            gas: 4712388,
            gasPrice: web3.utils.toWei("20", 'gwei')
    },
    local: {
          host: "172.31.54.59",
          port: 8545,
          network_id: 1, // Match Ganache(Truffle) network id
          gas: 5000000,
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      // version: "0.5.1",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  }
}
