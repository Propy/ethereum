"use strict";

const Web3 = require("web3");
const ProviderEngine = require("web3-provider-engine");
const WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');
const Web3Subprovider = require("web3-provider-engine/subproviders/provider.js");
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');

const ethereumjsWallet = require('ethereumjs-wallet');

// Create wallet from existing private key
const privateKey = require('./network_keys/private/rinkeby');
const wallet = ethereumjsWallet.fromPrivateKey(new Buffer(privateKey, "hex"));
const sender = "0x" + wallet.getAddress().toString("hex");

// Using rinkeby testnet
const apiKey = require('./network_keys/api/infura');
const providerUrl = "https://rinkeby.infura.io/" + apiKey;
const engine = new ProviderEngine();

const provider = new Web3.providers.HttpProvider(providerUrl);
const web3 = new Web3(provider);

// filters
engine.addProvider(new FilterSubprovider());
engine.addProvider(new WalletSubprovider(wallet, {}));
engine.addProvider(new Web3Subprovider(provider));
engine.start();  // FIXME: Truffle hangs after compilation/migration because of this


module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*", // Match any network id
            gas: 4000000,
        },
        rinkeby: {
            network_id: 4,
            provider: () => engine,
            from: sender,
            gas: 4712388,
            gasPrice: web3.toWei(20, 'gwei')
        }
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 999
        }
    }
};
