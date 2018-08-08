"use strict";

const Mock = artifacts.require('./Mock');
const MultiSigWallet = artifacts.require('./MultiSigWallet');
const Storage = artifacts.require('./Storage');

const Reverter = require("./helpers/reverter");
const { assertLogs, assertState, equal, reverts } = require("./helpers/assert");
const { ZERO_ADDRESS } = require("./helpers/constants");
const { AssertExpectations } = require('./helpers/mock');


contract("MultiSigWallet", function (accounts) {
    const reverter = new Reverter(web3);
    afterEach("revert", reverter.revert);

    let mock;
    let multiSigWallet;

    const owners = accounts.slice(0, 3);
    const unauthorized = accounts[9];

    function fillData(data, args) {
        const target = 2 + (64 * (args + 1)) - data.length;
        return data + '0'.repeat(target);
    }

    const multiSigInterface = web3.eth.contract(MultiSigWallet.abi).at("0x0");

    let assertExpectations;
    const defaultData = web3.eth.contract(Storage.abi).at("0x0").setManager.getData(accounts[5]);
    function multiSigData(method, args) {
        return multiSigInterface[method].getData(...args);
    }

    async function multiSigAction(method, args, from) {
        const result = await multiSigWallet[method](...args, {from: from});
        const txId = (await multiSigWallet.transactionCount()) - 1;
        const txInfo = await multiSigWallet.transactions(txId);
        return {
            logs: result.logs,
            destination: txInfo[0],
            value: txInfo[1],
            calldata: txInfo[2],
            executed: txInfo[3]
        }
    }

    before("setup", async () => {
        mock = await Mock.deployed();
        multiSigWallet = await MultiSigWallet.new(owners, 2);

        assertExpectations = AssertExpectations(mock);

        await reverter.snapshot();
    });

    it("should check initial state", async () => {
        await assertState(multiSigWallet, {
            transactionCount: [{exp: 0}],
            required: [{exp: 2}],
            owners: [
                {args: [0], exp: owners[0]},
                {args: [1], exp: owners[1]},
                {args: [2], exp: owners[2]},
                {args: [3], exp: "throws"},
            ],
            MAX_OWNER_COUNT: [{exp: 10}],
        });
    });

    describe("Submit transaction", () => {
        it("should revert when submitting a transaction with null destination", async () => {
            await reverts(multiSigWallet.submitTransaction(ZERO_ADDRESS, 0, defaultData, {from: owners[0]}));
        });

        it("should revert when submitting a transaction from unauthorized caller", async () => {
            await reverts(multiSigWallet.submitTransaction(Mock.address, 0, defaultData, {from: unauthorized}));
        });

        it("should add and confirm a transaction on a submission with correct data", async () => {
            const tx = await multiSigWallet.submitTransaction(Mock.address, 0, defaultData, {from: owners[0]});
            assertLogs(tx.logs, [
                {
                    address: multiSigWallet.address,
                    event: "Submission",
                    args: {
                        transactionId: 0
                    }
                },
                {
                    address: multiSigWallet.address,
                    event: "Confirmation",
                    args: {
                        sender: owners[0],
                        transactionId: 0
                    }
                }
            ]);
            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: false},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });
    });


    describe("Confirm transaction", () => {
        it("should revert when confirming a transaction from unauthorized caller", async () => {
            await multiSigWallet.submitTransaction(Mock.address, 0, defaultData, {from: owners[0]});
            
            await reverts(multiSigWallet.confirmTransaction(0, {from: unauthorized}));

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: false},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should revert when confirming non-existent transaction", async () => {
            await reverts(multiSigWallet.confirmTransaction(0, {from: owners[0]}));
            await reverts(multiSigWallet.confirmTransaction(1, {from: owners[0]}));
        });

        it("should revert when confirming already confirmed transaction", async () => {
            await multiSigWallet.submitTransaction(Mock.address, 0, defaultData, {from: owners[0]});
            
            await reverts(multiSigWallet.confirmTransaction(0, {from: owners[0]}));

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: false},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should confirm a transaction using correct data, then revert when confirming executed transaction", async () => {
            await multiSigWallet.submitTransaction(Mock.address, 0, defaultData, {from: owners[0]});
            
            const { logs, destination, value, calldata, executed } = await multiSigAction("confirmTransaction", [0], owners[1]);

            equal(destination, Mock.address);
            equal(value, 0);
            equal(calldata, defaultData)
            assert.isTrue(executed);

            assertLogs(logs, [
                {
                    address: multiSigWallet.address,
                    event: "Confirmation",
                    args: {
                        sender: owners[1],
                        transactionId: 0
                    }
                },
                {
                    address: multiSigWallet.address,
                    event: "Execution",
                    args: {
                        transactionId: 0
                    }
                }
            ]);

            await reverts(multiSigWallet.confirmTransaction(0, {from: owners[2]}));

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });
    });


    describe("Revoke confirmation", () => {
        it("should revert when revoking confirmation from unauthorized caller", async () => {
            await multiSigWallet.submitTransaction(Mock.address, 0, defaultData, {from: owners[0]});

            await reverts(multiSigWallet.revokeConfirmation(0, {from: unauthorized}));

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: false},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should revert when revoking unconfirmed transaction", async () => {
            await reverts(multiSigWallet.revokeConfirmation(0, {from: owners[0]}));
        });

        it("should revert when revoking confirmation for already executed transaction", async () => {
            await multiSigWallet.submitTransaction(Mock.address, 0, defaultData, {from: owners[0]});

            const { destination, value, calldata, executed } = await multiSigAction("confirmTransaction", [0], owners[1]);
            equal(destination, Mock.address);
            equal(value, 0);
            equal(calldata, defaultData)
            assert.isTrue(executed);

            await reverts(multiSigWallet.revokeConfirmation(0, {from: owners[0]}));

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should revoke confirmation using correct data", async () => {
            await multiSigWallet.submitTransaction(Mock.address, 0, defaultData, {from: owners[0]});
            await multiSigWallet.revokeConfirmation(0, {from: owners[0]});

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: false},
                    {args: [0, owners[1]], exp: false},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });
    });


    describe("Execute transaction", () => {
        it("should fail transaction execution if there is not enough ether, revert when executing a transaction from unauthorized caller and from an owner who didn't confirm it", async () => {
            await multiSigWallet.submitTransaction(Mock.address, 1, defaultData, {from: owners[0]});
            
            const { logs, destination, value, calldata, executed } = await multiSigAction("confirmTransaction", [0], owners[1]);
            equal(destination, Mock.address);
            equal(value, 1);
            equal(calldata, defaultData)
            assert.isFalse(executed);
            equal(logs[logs.length - 1].event, "ExecutionFailure");

            await reverts(multiSigWallet.executeTransaction(0, {from: unauthorized}));
            await reverts(multiSigWallet.executeTransaction(0, {from: owners[2]}));

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should revert when executing already executed transaction", async () => {
            await multiSigWallet.submitTransaction(Mock.address, 0, defaultData, {from: owners[0]});
            
            const { destination, value, calldata, executed } = await multiSigAction("confirmTransaction", [0], owners[1]);
            equal(destination, Mock.address);
            equal(value, 0);
            equal(calldata, defaultData)
            assert.isTrue(executed);

            await reverts(multiSigWallet.executeTransaction(0, {from: owners[1]}));

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should execute a transaction using correct data", async () => {
            await multiSigWallet.submitTransaction(Mock.address, 0, defaultData, {from: owners[0]});
            

            await mock.expect(multiSigWallet.address, 0, fillData(defaultData, 1), "throw");

            let { logs, destination, value, calldata, executed } = await multiSigAction("confirmTransaction", [0], owners[1]);
            equal(destination, Mock.address);
            equal(value, 0);
            equal(calldata, defaultData)
            await mock.popExpectation();

            assert.isTrue(executed);
            assertLogs(logs, [
                {
                    address: multiSigWallet.address,
                    event: "Confirmation",
                    args: {
                        sender: owners[1],
                        transactionId: 0
                    }
                },
                {
                    address: multiSigWallet.address,
                    event: "Execution",
                    args: {transactionId: 0 }
                }
            ]);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should allow to execute transactions without data", async () => {
            await multiSigWallet.submitTransaction(Mock.address, 0, "", {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assert.isTrue(txInfo.executed);
            assertLogs(txInfo.logs, [
                {
                    address: multiSigWallet.address,
                    event: "Confirmation",
                    args: {
                        sender: owners[1],
                        transactionId: 0
                    }
                },
                {
                    address: multiSigWallet.address,
                    event: "Execution",
                    args: { transactionId: 0 }
                }
            ]);
            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should allow to execute transactions with value", async () => {
            await multiSigWallet.submitTransaction(Mock.address, 1, defaultData, {from: owners[0]});
            

            let { logs, destination, value, calldata, executed } = await multiSigAction("confirmTransaction", [0], owners[1]);
            equal(destination, Mock.address);
            equal(value, 1);
            equal(calldata, defaultData);
            assert.isFalse(executed);
            equal(logs[logs.length - 1].event, "ExecutionFailure");

            const send = await multiSigWallet.send(1);
            equal(send.logs[0].event, "Deposit");

            const txInfo = await multiSigAction("executeTransaction", [0], owners[1]);
            assert.isTrue(txInfo.executed);
            assertLogs(txInfo.logs, [{
                address: multiSigWallet.address,
                event: "Execution",
                args: { transactionId: 0 }
            }]);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });
    });


    describe("Add owner", () => {
        it("should revert when adding an owner not from wallet itself", async () => {
            await reverts(multiSigWallet.addOwner(unauthorized, {from: unauthorized}));
            await reverts(multiSigWallet.addOwner(unauthorized, {from: owners[0]}));
        });

        it("should fail execution when adding already existing owner", async () => {
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("addOwner", [owners[0]]), {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assertLogs(txInfo.logs, [
                {
                    address: multiSigWallet.address,
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 0 }
                },
                {
                    address: multiSigWallet.address,
                    event: "ExecutionFailure",
                    args: { transactionId: 0 }
                }
            ]);
            assert.isFalse(txInfo.executed);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should revert when adding zero address owner", async () => {
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("addOwner", [ZERO_ADDRESS]), {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assertLogs(txInfo.logs, [
                {
                    address: multiSigWallet.address,
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 0 }
                },
                {
                    address: multiSigWallet.address,
                    event: "ExecutionFailure",
                    args: { transactionId: 0 }
                }
            ]);
            assert.isFalse(txInfo.executed);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should revert when adding an owner over the maximum limit", async () => {
            for (let i = 0; i <= 6; i++) {
                let addData = multiSigData("addOwner", [i + 1]);
                await multiSigWallet.submitTransaction(multiSigWallet.address, 0, addData, {from: owners[0]});
                const { executed } = await multiSigAction("confirmTransaction", [i], owners[1]);
                assert.isTrue(executed);
            }
            const currentOwners = await multiSigWallet.getOwners();
            equal(currentOwners.length, 10);

            let addData = multiSigData("addOwner", [accounts[8]]);
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, addData, {from: owners[0]});
            const { logs, executed } = await multiSigAction("confirmTransaction", [7], owners[1]);
            assert.isFalse(executed);
            assertLogs(logs, [
                {
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 7 }
                },
                {
                    event: "ExecutionFailure",
                    args: { transactionId: 7 }
                }
            ]);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 8}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: 1},
                    {args: [4], exp: 2},
                    {args: [5], exp: 3},
                    {args: [6], exp: 4},
                    {args: [7], exp: 5},
                    {args: [8], exp: 6},
                    {args: [9], exp: 7},
                    {args: [10], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                    {args: [1, owners[0]], exp: true},
                    {args: [1, owners[1]], exp: true},
                    {args: [1, owners[2]], exp: false},
                    {args: [2, owners[0]], exp: true},
                    {args: [2, owners[1]], exp: true},
                    {args: [2, owners[2]], exp: false},
                    {args: [3, owners[0]], exp: true},
                    {args: [3, owners[1]], exp: true},
                    {args: [3, owners[2]], exp: false},
                    {args: [4, owners[0]], exp: true},
                    {args: [4, owners[1]], exp: true},
                    {args: [4, owners[2]], exp: false},
                    {args: [5, owners[0]], exp: true},
                    {args: [5, owners[1]], exp: true},
                    {args: [5, owners[2]], exp: false},
                    {args: [6, owners[0]], exp: true},
                    {args: [6, owners[1]], exp: true},
                    {args: [6, owners[2]], exp: false},

                    {args: [7, owners[0]], exp: true},
                    {args: [7, owners[1]], exp: true},
                    {args: [7, owners[2]], exp: false},

                    {args: [8, owners[0]], exp: false},
                    {args: [8, owners[1]], exp: false},
                    {args: [8, owners[2]], exp: false},
                ],
            });
        });

        it("should add an owner using correct data", async () => {
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("addOwner", [unauthorized]), {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assertLogs(txInfo.logs, [
                {
                    address: multiSigWallet.address,
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 0 }
                },
                {
                    address: multiSigWallet.address,
                    event: "OwnerAddition",
                    args: { owner: unauthorized }
                },
                {
                    address: multiSigWallet.address,
                    event: "Execution",
                    args: { transactionId: 0 }
                }
            ]);
            assert.isTrue(txInfo.executed);
            equal(await multiSigWallet.owners(3), unauthorized);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: unauthorized},
                    {args: [4], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });
    });


    describe("Remove owner", () => {
        it("should revert when removing an owner not from wallet itself", async () => {
            await reverts(multiSigWallet.removeOwner(owners[1], {from: unauthorized}));
            await reverts(multiSigWallet.removeOwner(owners[1], {from: owners[0]}));
        });

        it("should fail transaction when removing non-existing owner", async () => {
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("removeOwner", [unauthorized]), {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assert.isFalse(txInfo.executed);
            assertLogs(txInfo.logs, [
                {
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 0 }
                },
                {
                    event: "ExecutionFailure",
                    args: { transactionId: 0 }
                }
            ]);
            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should remove owners with correct data and change required signatures number when decreasing owners to less than required number", async () => {
            let txInfo;

            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("removeOwner", [owners[2]]), {from: owners[0]});
            
            txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assert.isTrue(txInfo.executed);
            equal((await multiSigWallet.getOwners()).length, 2);
            equal(await multiSigWallet.required(), 2);

            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("removeOwner", [owners[1]]), {from: owners[0]});
            equal(await multiSigWallet.transactionCount(), 2);
            txInfo = await multiSigAction("confirmTransaction", [1], owners[1]);
            assert.isTrue(txInfo.executed);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 2}],
                required: [{exp: 1}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: "throws"},
                    {args: [2], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                    {args: [1, owners[0]], exp: true},
                    {args: [1, owners[1]], exp: true},
                    {args: [1, owners[2]], exp: false},
                ],
            });
        });
    });


    describe("Replace owner", () => {
        it("should revert when replacing an owner not from wallet itself", async () => {
            await reverts(multiSigWallet.replaceOwner(owners[1], unauthorized, {from: unauthorized}));
            await reverts(multiSigWallet.replaceOwner(owners[1], unauthorized, {from: owners[0]}));
        });

        it("should fail transaction when replacing non-existing owner", async () => {
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("replaceOwner", [unauthorized, unauthorized]), {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assert.isFalse(txInfo.executed);
            assertLogs(txInfo.logs, [
                {
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 0 }
                },
                {
                    event: "ExecutionFailure",
                    args: { transactionId: 0 }
                }
            ]);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should fail transaction when replacing to existing owner", async () => {
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("replaceOwner", [owners[2], owners[1]]), {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assert.isFalse(txInfo.executed);
            assertLogs(txInfo.logs, [
                {
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 0 }
                },
                {
                    event: "ExecutionFailure",
                    args: { transactionId: 0 }
                }
            ]);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should fail transaction when replacing non-existing owner to existing owner", async () => {
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("replaceOwner", [unauthorized, owners[1]]), {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assert.isFalse(txInfo.executed);
            assertLogs(txInfo.logs, [
                {
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 0 }
                },
                {
                    event: "ExecutionFailure",
                    args: { transactionId: 0 }
                }
            ]);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should replace an owner using correct data", async () => {
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("replaceOwner", [owners[2], unauthorized]), {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assert.isTrue(txInfo.executed);
            assertLogs(txInfo.logs, [
                {
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 0 }
                },
                {
                    event: "OwnerRemoval",
                    args: { owner: owners[2] }
                },
                {
                    event: "OwnerAddition",
                    args: { owner: unauthorized }
                },
                {
                    event: "Execution",
                    args: { transactionId: 0 }
                }
            ]);
            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: unauthorized},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });
    });


    describe("Change requirement" , () => {
        it("should revert when changing a requirement not from wallet itself", async () => {
            await reverts(multiSigWallet.changeRequirement(1, {from: unauthorized}));
            await reverts(multiSigWallet.changeRequirement(1, {from: owners[0]}));
        });

        it("should fail transaction when changing a requirement to zero", async () => {
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("changeRequirement", [0]), {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assert.isFalse(txInfo.executed);
            assertLogs(txInfo.logs, [
                {
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 0 }
                },
                {
                    event: "ExecutionFailure",
                    args: { transactionId: 0 }
                }
            ]);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should fail transaction when changing a requirement to more than owners.length number", async () => {
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("changeRequirement", [4]), {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assert.isFalse(txInfo.executed);
            assertLogs(txInfo.logs, [
                {
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 0 }
                },
                {
                    event: "ExecutionFailure",
                    args: { transactionId: 0 }
                }
            ]);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 2}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });

        it("should change a requirement using correct data", async () => {
            await multiSigWallet.submitTransaction(multiSigWallet.address, 0, multiSigData("changeRequirement", [1]), {from: owners[0]});
            
            const txInfo = await multiSigAction("confirmTransaction", [0], owners[1]);
            assert.isTrue(txInfo.executed);
            assertLogs(txInfo.logs, [
                {
                    event: "Confirmation",
                    args: { sender: owners[1], transactionId: 0 }
                },
                {
                    event: "RequirementChange",
                    args: { required: 1 }
                },
                {
                    event: "Execution",
                    args: { transactionId: 0 }
                }
            ]);

            await assertState(multiSigWallet, {
                transactionCount: [{exp: 1}],
                required: [{exp: 1}],
                owners: [
                    {args: [0], exp: owners[0]},
                    {args: [1], exp: owners[1]},
                    {args: [2], exp: owners[2]},
                    {args: [3], exp: "throws"},
                ],
                confirmations: [
                    {args: [0, owners[0]], exp: true},
                    {args: [0, owners[1]], exp: true},
                    {args: [0, owners[2]], exp: false},
                ],
            });
        });
    });

})
