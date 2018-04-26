"use strict";

const Remotes = {
    Rinkeby: "http://rinkeby.propy.biz:8545",
    Mainnet: {
        Geth: "http://eth.propy.biz:8545",
        Parity: "http://parity.propy.biz:8545"
    }
}

const Web3 = require("web3");
const Provider = require('truffle-privatekey-provider');

const ethereumjsWallet = require('ethereumjs-wallet');

const PrivateKey = require('./network_keys/private/keys');

const apiKey = require('./network_keys/api/infura');
const providerUrl = "https://rinkeby.infura.io/" + apiKey;

let provider = new Provider(PrivateKey.Rinkeby[0], "http://localhost:8545");
const web3 = new Web3(provider);

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
            provider: () => new Provider(PrivateKey.Rinkeby[0], Remotes.Rinkeby),
            gas: 4712388,
            gasPrice: web3.toWei(20, 'gwei')
        },
        mainnet_parity: {
            network_id: 1,
            provider: () => new Provider(PrivateKey.Mainnet[0], Remotes.Mainnet.Parity),
            gas: 5000000,
            gasPrice: web3.toWei(4, 'gwei')
        },
        mainnet_geth: {
            network_id: 1,
            provider: () => new Provider(PrivateKey.Mainnet[0], Remotes.Mainnet.Geth),
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
