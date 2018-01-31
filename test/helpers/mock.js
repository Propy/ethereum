"use strict";

const RolesLibrary = artifacts.require('./RolesLibrary.sol');
const RolesLibraryInterface = web3.eth.contract(RolesLibrary.abi).at("0x0");

const { equal } = require("./assert");
const { arrayStub } = require('./helpers');

module.exports = {
    AssertExpectations: function (mock) {
        return async function (expected = 0, callsCount = null) {
            const expectationsLeft = await mock.expectationsLeft();
            equal(expectationsLeft, expected);
            const expectationsCount = await mock.expectationsCount();
            const calls = await mock.callsCount();
            equal(calls, callsCount === null ? expectationsCount : callsCount);
        }
    },
    IgnoreAuth: function (mock) {
        return function (enabled = true) {
            return mock.ignore(RolesLibraryInterface.canCall.getData(0, 0, 0).slice(0, 10), enabled);
        };
    },
    ExpectAuth: function (mock) {
        return function expectAuthCheck(contract, caller, method) {
            let args;
            let funcIndex;
            for (let f in contract.abi) {
                let func = contract.abi[f];
                if (func.name === method) {
                    args = func.inputs.length;
                    funcIndex = f;
                    break;
                }
            }

            let calldata;
            if (args > 0) {

                // Create array of empty method arguments, take care about possible array-typed args
                let inputs = contract.abi[funcIndex].inputs;
                let stub = arrayStub(args);
                for (let i = 0; i < inputs.length; i++) {
                    if (inputs[i].type[inputs[i].type.length - 1] === ']') {
                        stub[i] = [];
                    }
                }

                calldata = contract.contract[method].getData(...stub);
            } else {
                calldata = contract.contract[method].getData();
            }

            return mock.expect(
                contract.address, 0,
                RolesLibraryInterface.canCall.getData(
                    caller,
                    contract.address,
                    calldata.slice(0, 10)
                ), 0
            )
        }
    }
}
