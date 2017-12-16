"use strict";

const BN = require('bignumber.js');
const assert = require('assert');
const Asserts = require('./asserts');
const asserts = Asserts(assert);
const ethUtil = require('ethereumjs-util');

//var SolidityCoder = require("web3/lib/solidity/coder.js");
const SolidityEvent = require("web3/lib/web3/event.js");


function isBN(obj) {
    if (typeof obj === 'object') {
        if ('s' in obj && 'e' in obj && 'c' in obj) {
            return true;
        }
    }
    return false;
}

module.exports = {

    BIGGEST_UINT: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    FULL_ADDRESS: "0xffffffffffffffffffffffffffffffffffffffff",
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
    ZERO_BYTES32: "0x0000000000000000000000000000000000000000000000000000000000000000",

    //getSig: (callData) => web3.sha3(callData).slice(0, 10),

    bn: (n) => new BN(n),
    keys: (obj) => Object.keys(obj),
    floor: (n) => Math.floor(n),
    now: () => Math.floor(Date.now() / 1000),
    shallowCopy: (obj) => Object.assign({}, obj),
    randint: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),
    randchoice: (array) => array[this.randint(0, array.length - 1)],
    compareBigNumberLists: (result, expected) => {
        //console.log(result, expected);
        for (let i in result) {
            assert.equal(result[i].toString(), expected[i].toString());
        }
    },

    balance: (address) => web3.eth.getBalance(address),
    spendGas: (tx, member, gasPrice) => {
        member.gasEthUsed += (tx.receipt.gasUsed * gasPrice);
    },

    getSig: (method, args) => method.getData(...args).slice(0, 10),

    increaseTime: (time) => {
        return new Promise((resolve, reject) => {
            web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [time],
                id: new Date().getTime()
            }, (error, result) => error ? reject(error) : resolve(result.result))
        });
    },

    mine: () => {
        return new Promise((resolve, reject) => {
            web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "evm_mine",
                id: new Date().getTime()
            }, (error, result) => error ? reject(error) : resolve(result.result))
        });
    },

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

    eventEquals: (tx, event) => {
        assert.equal(tx.logs[0].event, event);
    },

    error: (tx, events, contract, text) => {
        assert.equal(tx.logs.length, 1);
        assert.equal(tx.logs[0].address, events.address);
        assert.equal(tx.logs[0].event, "Error");
        assert.equal(tx.logs[0].args.self, contract.address);
        assert.isTrue(web3.toAscii(tx.logs[0].args.msg).includes(text));
    },

    ignoreAuth: (mock, enabled = true) => {
        //return mock.ignore(roles2LibraryInterface.canCall.getData().slice(0, 10), enabled);
    },

    assertExpectations: async (mock, expected = 0, callsCount = null) => {
        const expectationsLeft = await mock.expectationsLeft();
        assert.equal(expectationsLeft, expected);
        const expectationsCount = await mock.expectationsCount();
        const calls = await mock.callsCount();
        asserts.equal(calls, callsCount === null ? expectationsCount : callsCount);
    },

    assertLogs: (txLogs, logs) => {
        assert.equal(txLogs.length, logs.length);
        for (let i in logs) {
            try {
                let log = logs[i];
                if (log.address) {
                    assert.equal(txLogs[i].address, log.address);
                }
                if (log.event) {
                    assert.equal(txLogs[i].event, log.event);
                }
                for (let a in log.args) {
                    if (typeof log.args[a] === "array" || typeof log.args[a] === "object") {
                        if (isBN(txLogs[i].args[a])) {
                            assert.equal(txLogs[i].args[a].toString(), log.args[a].toString());
                        }
                        else {
                            // Compare array lengths and contents
                            assert.equal(txLogs[i].args[a].length, log.args[a].length);
                            for (let m in txLogs[i].args[a]) {
                                assert.equal(txLogs[i].args[a][m], log.args[a][m]);
                            }
                        }
                    } else {
                        assert.equal(txLogs[i].args[a], log.args[a]);
                    }
                }
            } catch (e) {
                console.error(e);
                console.log("Actual log:");
                console.log(txLogs[i]);
                console.log("Expected log:");
                console.log(logs[i]);
            }
        }
    },

    /**
     * Helper to assert current contract state.
     *
     * @param {Object} contract
     * @param {Object} state
     *
     * Structure of `state` argument:
     *  {
     *    contractAttribute: [
     *      {args: [argumentsToProvide], exp: expectedValue},
     *    ],
     *  }
     *
     *
     * Example:
     * {
     *   // mapping (uint => string) public supplies;
     *   supplies: [
     *      {args: [1], exp: "Apple"},
     *      {args: [2], exp: "Pear"}
     *   ],
     *   // mapping (address => mapping (address => uint)) public allowance;
     *   allowance: [
     *      {args: ["0x1", "0x2"], exp: 25}
     *   ]
     * }
     *
     */
    assertState: async (contract, state) => {
        for (let attribute in state) {
            for (let scenario of state[attribute]) {

                //console.log(attribute);
                //console.log(scenario);

                let args = scenario.args && scenario.args.length ? scenario.args : [];

                if (scenario.exp === "throws") {
                    await asserts.error(contract[attribute].call, args);
                } else {
                    const result = await contract[attribute].call(...args);
                    assert.equal(result.valueOf(), scenario.exp.valueOf());
                }
            }
        }
    },

    assertJump: (error) => {
        assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
    },

    assertEthBalance: (address, expectedValue) => {
        return assert.equal(web3.eth.getBalance(address).valueOf(), expectedValue)
    },

    equal: (actual, expected) => {
       assert.equal(actual.valueOf(), expected.valueOf());
    },

    bytes32: (data) => {
        return '0x' + ethUtil.setLengthLeft(data, 32).toString('hex')
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
    }
}
