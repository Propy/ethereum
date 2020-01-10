"use strict";

const axios = require('axios');
const BN = require('bignumber.js');
const assert = require('chai').assert;
const ethUtil = require('ethereumjs-util');

//var SolidityCoder = require("web3/lib/solidity/coder.js");
//const SolidityEvent = require("web3/lib/web3/event.js");


function getAllProperties(obj) {
    if (obj == null) return [];
        let selfMethods = Object.getOwnPropertyNames(obj);
        console.log(selfMethods)
        let prototypeMethods = getAllProperties(Object.getPrototypeOf(obj)).filter(function(e) {
        return !selfMethods.includes(e);
    });
    return prototypeMethods.concat(selfMethods);
}

function bn(n) {
    return new BN(n);
}

module.exports = {

    //getSig: (callData) => web3.sha3(callData).slice(0, 10),

    bn: bn,
    keys: (obj) => Object.keys(obj),
    floor: (n) => Math.floor(n),
    now: () => Math.floor(Date.now() / 1000),
    shallowCopy: (obj) => Object.assign({}, obj),
    randint: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),
    randchoice: (array) => array[this.randint(0, array.length - 1)],
    arrayStub: (elements, fillWith = 0) => (new Array(elements)).fill(fillWith),

    getAllProperties: getAllProperties,

    balance: (address) => web3.eth.getBalance(address),
    spendGas: (tx, member, gasPrice) => {
        member.gasEthUsed += (tx.receipt.gasUsed * gasPrice);
    },

    getSig: (method, args) => method.getData(...args).slice(0, 10),
    getSigFromName: (callData) => web3.sha3(callData).slice(0, 10),

    instance: (contractSource, address) => {
        return web3.eth.contract(contractSource.abi).at(address);
    },

    getFlag: index => {
        return web3.toBigNumber(2).pow(index*2);
    },

    getEvenFlag: index => {
        return web3.toBigNumber(2).pow(index*2 + 1);
    },

    getTopics: contracts => {
        let topics = {};
        for (let contract_name in contracts) {
            const contract = contracts[contract_name];
            let decoders = contract.abi.filter(json => json.type === 'event');
            for (let json of decoders) {
                let decoder = new SolidityEvent(null, json, null);
                topics['0x' + decoder.signature()] = decoder;
            }
        }
        return topics;
    },

    bytes32: (data, right=false) => {
        const side = right ? 'Right' : 'Left';
        return '0x' + ethUtil['setLength' + side](data, 32).toString('hex')
    },

    parseLogs: (topics, logs) => {
        let result = [];
        for (let log of logs) {
            result.push(topics[log.topics[0]].decode(log));
        }
        return result;
    },

    receipt: async (tx) => {
        return web3.eth.getTransactionReceipt(await tx);
    },

    name: (truffleContract) => {
        return truffleContract.constructor._json.contractName;
    },

    usdPrice: async (gasUsed, gasPrice=web3.toWei(60, 'gwei')) => {
        const response = await axios.get('https://api.coinmarketcap.com/v1/ticker/ethereum/');
        const rate = response.data[0].price_usd;
        return web3.fromWei(
            bn(gasUsed).mul(gasPrice), 'ether'
        ).mul(rate).toString();
    },
}
