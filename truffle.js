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
    networks: {
        test: {
            host: "127.0.0.1",
            port: 8545,
            network_id: 5777, // Match Ganache(Truffle) network id
            gas: 5000000,
        },
        rinkeby: {
            network_id: 4,
            provider: () => new Provider(Wallets.Rinkeby, Infura.Rinkeby),
            gas: 4712388,
            gasPrice: web3.toWei(20, 'gwei')
        },
        mainnet: {
            network_id: 1,
            provider: () => new Provider(Wallets.Mainnet, Infura.Mainnet),
            gas: 5000000,
            gasPrice: web3.toWei(12, 'gwei')
        },
        ropsten: {
            network_id: 1,
            provider: () => new Provider(Wallets.Ropsten, Infura.Ropsten),
            gas: 5000000,
            gasPrice: web3.toWei(4, 'gwei')
        },
        kovan: {
            network_id: 1,
            provider: () => new Provider(Wallets.Kovan, Infura.Kovan),
            gas: 5000000,
            gasPrice: web3.toWei(4, 'gwei')
        }
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 999
        }
    }
};
