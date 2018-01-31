"use strict";


const assert = require('chai').assert;



function isBN(obj) {
    if (typeof obj === 'object') {
        if ('s' in obj && 'e' in obj && 'c' in obj) {
            return true;
        }
    }
    return false;
}

async function throws(call, args) {
    let success = false;
    try {
        await call(...args);
        success = true;
    } catch (e) {}
    assert.equal(success, false);
}


module.exports = {

    equal: (actual, expected) => {
       assert.equal(actual.valueOf(), expected.valueOf());
    },

    error: (tx, events, contract, text) => {
        assert.equal(tx.logs.length, 1);
        assert.equal(tx.logs[0].address, events.address);
        assert.equal(tx.logs[0].event, "Error");
        assert.equal(tx.logs[0].args.self, contract.address);
        assert.isTrue(web3.toAscii(tx.logs[0].args.msg).includes(text));
    },

    reverts: promise => {
        return promise.then(
            assert.fail,
            (error) => {
                assert.include(error.message, "revert");
                return true;
            }
        );
    },

    asserts: promise => {
        return promise.then(
            assert.fail,
            (error) => {
                assert.include(error.message, "assert");
                return true;
            }
        );
    },

    throws: throws,

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
                console.log();
                console.log("Actual log args:")
                console.log(txLogs[i].args);
                console.log("Expected log args:");
                console.log(logs[i].args);
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
                    await throws(contract[attribute].call, args);
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
};
