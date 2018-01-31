"use strict";

const BN = require('bignumber.js');

const { assertLogs, assertState, equal, throws } = require("../assert");
const { bytes32, parseLogs } = require("../helpers");

const Asserts = require('../asserts');
const Reverter = require('../reverter');
const asserts = Asserts(assert);
const reverter = new Reverter(web3);

const BaseDeed = artifacts.require("BaseDeed");
const BaseDeedInterface = web3.eth.contract(BaseDeed.abi).at('0x0');


module.exports = function (base) {

    async function reserveDeed(base, data, returns, expectedState, isError, logs) {
        await assertState(base.baseDeed, base.initialState);
        const result = await base.mock.forwardCall.call(base.baseDeed.address, data);
        equal(result, bytes32(returns));

        if (!isError) {
            const tx = await base.mock.forwardCall(base.baseDeed.address, data);
            const txLogs = parseLogs(base.topics, tx.receipt.logs);
            //console.log(txLogs);
            assertLogs(txLogs, logs);
        } else {
            console.log("KINDA AWKWARD")
            await throws(base.mock.forwardCall, [base.baseDeed.address, data]);
        }
        await assertState(base.baseDeed, expectedState);
    }

    /*
    it("should NOT allow to reserve deed not from controller");

    it("should NOT allow to reserve deed when it is already reserved");

    it("should NOT allow to reserve deed when it is already approved");

    it("should NOT allow to reserve deed with empty `_property` argument", async () => {
        const data = BaseDeedInterface.reserve.getData(
            ZERO_ADDRESS,
            base.price,
            base.seller,
            base.buyer,
            base.escrow,
            base.intermediaries,
            base.payments
        );
        await reserveDeed(base, data, 0, base.initialState, false, [{
            address: base.baseDeed.address,
            event: "Error",
            args: {msg: "Some of arguments are invalid."}
        }]);
    });

    it("should NOT allow to reserve deed with empty `_base.price` argument", async () => {
        const data = BaseDeedInterface.reserve.getData(
            base.mock.address,
            0,
            base.seller,
            base.buyer,
            base.escrow,
            base.intermediaries,
            base.payments
        );
        await reserveDeed(base, data, 0, base.initialState, false, [{
            address: base.baseDeed.address,
            event: "Error",
            args: {msg: "Some of arguments are invalid."}
        }]);
    });

    it("should NOT allow to reserve deed with empty `_base.seller` argument", async () => {
        const data = BaseDeedInterface.reserve.getData(
            base.mock.address,
            base.price,
            ZERO_ADDRESS,
            base.buyer,
            base.escrow,
            base.intermediaries,
            base.payments
        );
        await reserveDeed(base, data, 0, base.initialState, false, [{
            address: base.baseDeed.address,
            event: "Error",
            args: {msg: "Some of arguments are invalid."}
        }]);
    });

    it("should NOT allow to reserve deed with empty `_base.buyer` argument", async () => {
        const data = BaseDeedInterface.reserve.getData(
            base.mock.address,
            base.price,
            base.seller,
            ZERO_ADDRESS,
            base.escrow,
            base.intermediaries,
            base.payments
        );
        await reserveDeed(base, data, 0, base.initialState, false, [{
            address: base.baseDeed.address,
            event: "Error",
            args: {msg: "Some of arguments are invalid."}
        }]);
    });

    it("should NOT allow to reserve deed with empty `_base.escrow` argument", async () => {
        const data = BaseDeedInterface.reserve.getData(
            base.mock.address,
            base.price,
            base.seller,
            base.buyer,
            ZERO_ADDRESS,
            base.intermediaries,
            base.payments
        );
        await reserveDeed(base, data, 0, base.initialState, false, [{
            address: base.baseDeed.address,
            event: "Error",
            args: {msg: "Some of arguments are invalid."}
        }]);
    });

    it("should NOT allow to reserve deed with lack of base.intermediaries", async () => {
        const incorrectIntermediaries = base.intermediaries.slice(0, base.intermediaries.length - 1);
        const data = BaseDeedInterface.reserve.getData(
            base.mock.address,
            base.price,
            base.seller,
            base.buyer,
            base.escrow,
            incorrectIntermediaries,
            base.payments
        );
        await reserveDeed(base, data, 0, base.initialState, false, [{
            address: base.baseDeed.address,
            event: "Error",
            args: {msg: "Provided intermediaries list do not match with required one."}
        }]);
    });

    it("should NOT allow to reserve deed with excess of base.intermediaries", async () => {
        const incorrectIntermediaries = base.intermediaries.slice();
        incorrectIntermediaries.push(base.accounts[9]);
        const data = BaseDeedInterface.reserve.getData(
            base.mock.address,
            base.price,
            base.seller,
            base.buyer,
            base.escrow,
            incorrectIntermediaries,
            base.payments
        );
        await reserveDeed(base, data, 0, base.initialState, false, [{
            address: base.baseDeed.address,
            event: "Error",
            args: {msg: "Provided intermediaries list do not match with required one."}
        }]);
    });

    it("should NOT allow to reserve deed with lack of `_base.payments`", async () => {
        const incorrectPayments = [];
        const data = BaseDeedInterface.reserve.getData(
            base.mock.address,
            base.price,
            base.seller,
            base.buyer,
            base.escrow,
            base.intermediaries,
            incorrectPayments
        );
        await reserveDeed(base, data, 0, base.initialState, false, [{
            address: base.baseDeed.address,
            event: "Error",
            args: {msg: "Some of arguments are invalid."}
        }]);
    });

    it("should NOT allow to reserve deed with excess of `_base.payments`", async () => {
        const incorrectPayments = [base.price, base.price];
        const data = BaseDeedInterface.reserve.getData(
            base.mock.address,
            base.price,
            base.seller,
            base.buyer,
            base.escrow,
            base.intermediaries,
            incorrectPayments
        );
        await reserveDeed(base, data, 0, base.initialState, false, [{
            address: base.escrowContract.address,
            event: "Error",
            args: {msg: "Payment arrays do not match."}
        }]);
    });

    it("should NOT allow to reserve deed with zero elements in `_base.payments` array", async () => {
        const incorrectPayments = [0];
        const data = BaseDeedInterface.reserve.getData(
            base.mock.address,
            base.price,
            base.seller,
            base.buyer,
            base.escrow,
            base.intermediaries,
            incorrectPayments
        );
        await reserveDeed(base, data, 0, base.initialState, false, [{
            address: base.escrowContract.address,
            event: "Error",
            args: {msg: "Payment amount can not be zero."}
        }]);
    });

    it("should NOT allow to reserve deed with sum of `_base.payments` array less than `_base.price`", async () => {
        const incorrectPrice = (new BN(base.price)).sub(1);
        const incorrectPayments = [incorrectPrice];
        const data = BaseDeedInterface.reserve.getData(
            base.mock.address,
            base.price,
            base.seller,
            base.buyer,
            base.escrow,
            base.intermediaries,
            incorrectPayments
        );
        await reserveDeed(base, data, 0, base.initialState, false, [{
            address: base.escrowContract.address,
            event: "Error",
            args: {msg: "Sum of all payments can not be less than Property price."}
        }]);
    });


    it("should NOT allow to approve deed when it's not reserved yet");
    */

    it("should allow to reserve Deed with correct data", async () => {
        const data = BaseDeedInterface.reserve.getData(
            base.mock.address,
            base.price,
            base.seller,
            base.buyer,
            base.escrow,
            base.intermediaries,
            base.payments
        );
        const intermediariesExp = base.intermediaries.map(function(item, i) {return {args: [i], exp: item}});
        intermediariesExp.push({args: [base.intermediaries.length], exp: "throws"});
        const expectedState = {
            status: [{exp: 1}],
            metaDeed: [{exp: base.metaDeed.address}],
            property: [{exp: base.mock.address}],
            price: [{exp: base.price}],
            seller: [{exp: base.seller}],
            buyer: [{exp: base.buyer}],
            escrow: [{exp: base.escrow}],
            intermediaries: intermediariesExp,
        };
        let logs = [
            {
                address: base.escrowContract.address,
                event: "Initiated",
                args: {total: base.price}
            },
            {
                address: base.baseDeed.address,
                event: "PartyDesignated",
                args: {
                    party: 1,
                    who: base.seller
                }
            },
            {
                address: base.baseDeed.address,
                event: "PartyDesignated",
                args: {
                    party: 2,
                    who: base.buyer
                }
            },
            {
                address: base.baseDeed.address,
                event: "PartyDesignated",
                args: {
                    party: 3,
                    who: base.escrow
                }
            },
        ];
        for (let i = 0; i < base.intermediaries.length; i++) {
            logs.push({
                address: base.baseDeed.address,
                event: "PartyDesignated",
                args: {
                    party: i + 4,
                    who: base.intermediaries[i]
                }
            });
        }
        logs.push({
            address: base.baseDeed.address,
            event: "StatusUpdate",
            args: {status: 1}
        });

        await reserveDeed(base, data, 1, expectedState, false, logs);
        await base.reverter.snapshot();
    });

    it("should NOT allow to approve deed not from controller");

    it("should NOT allow to approve deed when it's already approved");


}
