"use strict";

const BN = require('bignumber.js');
const { assertExpectations, assertLogs, bytes32, parseLogs, receipt, FULL_ADDRESS } = require('../helpers');


module.exports = (base) => {

    it("should NOT allow to call `action` with zero move value", async () => {
        const tx = await base.baseDeed.action(0, [], [], 1, {from: base.owner});
        //const txLogs = parseLogs(base.topics, tx.logs);
        assertLogs(tx.logs, [{
            address: base.baseDeed.address,
            event: "Error",
            args: { msg: "Wrong Move number." }
        }]);
    });

    it("should NOT allow to call `action` with zero move status", async () => {
        const tx = await base.baseDeed.action(1, [], [], 0, {from: base.owner});
        //const txLogs = parseLogs(base.topics, tx.logs);
        assertLogs(tx.logs, [{
            address: base.baseDeed.address,
            event: "Error",
            args: { msg: "Wrong Move status." }
        }]);
    });

    it("should NOT allow to call `action` with move status more than 2", async () => {
        await base.asserts.error(base.baseDeed.action, [1, [], [], 3, {from: base.owner}]);
    });

    it("should check all moves", async () => {
        const SUCCESS = 1;
        const FAILED = 2;

        const SELLER = 1;
        const BUYER = 2;
        const ESCROW = 3;
        let parties = ["", base.seller, base.buyer, base.escrow];
        for (let address of base.intermediaries) {
            parties.push(address);
        }

        let moves = {};
        const movesCount = (await base.metaDeed.movesCount.call()).valueOf();

        for (let i = 1; i <= movesCount; i++) {
            const move = await base.metaDeed.moves.call(i);
            moves[i] = {
                name: move[0],
                party: move[1].toNumber(),
                role: move[2].toNumber(),
                args: move[3].toNumber(),
                dependency: move[4].toNumber(),
                receiver: move[5].toNumber(),
                returnTo: move[6].toNumber(),
                unlockPaymentAt: move[7].toNumber(),
                isFinal: move[8]
            }
        }

        for (let m in moves) {
            let move = moves[m];
            m = parseInt(m);

            // Check that we can't retry the move that is done
            if (m > 1 && moves[m - 1].party !== ESCROW) {
                let tx = await base.baseDeed.action(m - 1, [], [], 1, {from: parties[moves[m - 1].party]});
                assertLogs(tx.logs, [{
                    address: base.baseDeed.address,
                    event: "Error",
                    args: { msg: "Move is already done." }
                }]);
            }

            for (let i = 1; i <= parties.length; i++) {
                // Check the call from all parties except correct party
            }

            if (m == movesCount) break;  // FIXME

            if (move.party !== ESCROW) {
                let args = new Array(moves.args).fill('1');
                let tx = await base.baseDeed.action(m, args, args, 1, {from: parties[move.party]});
                // TODO: check logs
            }
            else {
                let currentMoveIndex = await base.escrowContract.currentMoveIndex.call();
                let paymentMove = await base.escrowContract.paymentMoves.call(currentMoveIndex);
                let payment = await base.escrowContract.payments.call(paymentMove);
                let receiverWallet = parties[move.receiver];
                let returnToWallet = parties[move.returnTo];

                await base.mock.expect(
                    base.baseDeed.address,
                    0,
                    base.UsersRegistryInterface.getWallet.getData(parties[move.receiver]),
                    bytes32(receiverWallet)
                )
                await base.mock.expect(
                    base.baseDeed.address,
                    0,
                    base.UsersRegistryInterface.getWallet.getData(parties[move.returnTo]),
                    bytes32(returnToWallet)
                )
                let tx = await base.escrowContract.send(payment, {from: base.owner});
                assertExpectations(base.mock);
                let txLogs = parseLogs(base.topics, tx.receipt.logs);
                assertLogs(txLogs, [
                    {
                        address: base.escrowContract.address,
                        event: "PaymentReceived",
                        args: {
                            move: m,
                            who: base.owner,
                            value: payment
                        }
                    },
                    {
                        address: base.escrowContract.address,
                        event: "PaymentAssigned",
                        args: {
                            move: m,
                            unlockAt: move.unlockPaymentAt,
                            receiver: receiverWallet,
                            returnTo: returnToWallet,
                            value: payment
                        }
                    },
                    {
                        address: base.baseDeed.address,
                        event: "MoveDone",
                        args: {
                            move: m,
                            status: SUCCESS
                        }
                    }
                ]);


            }
            //
        }

    });

    /*
    it("should do PURCHASE_AGREEMENT move", async () => {
        const broker_seller = base.intermediaries[0];
        const broker_buyer = base.intermediaries[1];
        const notary = base.intermediaries[2];
        const title_company_agent = base.intermediaries[3];

        const PURCHASE_AGREEMENT = 1;
        const TITLE_REPORT = 2;
        const SELLER_DISCLOSURES = 3;
        const PAYMENT = 4;
        const AFFIDAVIT = 5;
        const OWNERSHIP_TRANSFER = 6;

        const STATUS_SUCCESS = 1;
        const STATUS_FAIL = 2;

        // Since this is not pre-deployed truffle contract, but fetched
        // from network, we get tx hash instead of parsed tx object as
        // a result of execution. So we need to parse it ourselves.
        const tx = await receipt(base.baseDeed.action(
            PURCHASE_AGREEMENT, ["PURCHASE_AGREEMENT"], [web3.sha3("1")], STATUS_SUCCESS,
            {from: broker_seller}
        ));
        await base.reverter.snapshot();

        // And we need to parse logs as well
        const txLogs = parseLogs(base.topics, tx.logs);

        assertLogs(txLogs, [{
                address: base.baseDeed.address,
                event: "DataProvided",
                args: {who: broker_seller}
            },
            {
                address: base.baseDeed.address,
                event: "MoveDone",
                args: {
                    move: PURCHASE_AGREEMENT,
                    status: STATUS_SUCCESS
                }
        }]);
    });
/*
    it("should do TITLE_REPORT move", async () => {
        const broker_seller = base.intermediaries[0];
        const broker_buyer = base.intermediaries[1];
        const notary = base.intermediaries[2];
        const title_company_agent = base.intermediaries[3];

        const PURCHASE_AGREEMENT = 1;
        const TITLE_REPORT = 2;
        const SELLER_DISCLOSURES = 3;
        const PAYMENT = 4;
        const AFFIDAVIT = 5;
        const OWNERSHIP_TRANSFER = 6;

        const STATUS_SUCCESS = 1;
        const STATUS_FAIL = 2;

        const tx = await base.baseDeed.action(
            TITLE_REPORT, ["TITLE_REPORT"], [web3.sha3("1")], STATUS_SUCCESS,
            {from: base.seller}
        );
        await base.reverter.snapshot();
        assertLogs(tx.logs, [{
                address: base.baseDeed.address,
                event: "DataProvided",
                args: {who: base.seller}
            },
            {
                address: base.baseDeed.address,
                event: "MoveDone",
                args: {
                    move: TITLE_REPORT,
                    status: STATUS_SUCCESS
                }
        }]);
    });

    it("should do SELLER_DISCLOSURES move", async () => {
        const broker_seller = base.intermediaries[0];
        const broker_buyer = base.intermediaries[1];
        const notary = base.intermediaries[2];
        const title_company_agent = base.intermediaries[3];

        const PURCHASE_AGREEMENT = 1;
        const TITLE_REPORT = 2;
        const SELLER_DISCLOSURES = 3;
        const PAYMENT = 4;
        const AFFIDAVIT = 5;
        const OWNERSHIP_TRANSFER = 6;

        const STATUS_SUCCESS = 1;
        const STATUS_FAIL = 2;

        const tx = await base.baseDeed.action(
            SELLER_DISCLOSURES, ["SELLER_DISCLOSURES"], [web3.sha3("1")], STATUS_SUCCESS,
            {from: broker_seller}
        );
        await base.reverter.snapshot();
        assertLogs(tx.logs, [{
                address: base.baseDeed.address,
                event: "DataProvided",
                args: {who: broker_seller}
            },
            {
                address: base.baseDeed.address,
                event: "MoveDone",
                args: {
                    move: SELLER_DISCLOSURES,
                    status: STATUS_SUCCESS
                }
        }]);
    });

    it("should do PAYMENT move through escrow contract", async () => {
        const broker_seller = base.intermediaries[0];
        const broker_buyer = base.intermediaries[1];
        const notary = base.intermediaries[2];
        const title_company_agent = base.intermediaries[3];

        const PURCHASE_AGREEMENT = 1;
        const TITLE_REPORT = 2;
        const SELLER_DISCLOSURES = 3;
        const PAYMENT = 4;
        const AFFIDAVIT = 5;
        const OWNERSHIP_TRANSFER = 6;

        const STATUS_SUCCESS = 1;
        const STATUS_FAIL = 2;

        await base.mock.expect(
            base.baseDeed.address,
            0,
            base.UsersRegistryInterface.getWallet.getData(base.seller),
            bytes32(base.seller)
        )
        await base.mock.expect(
            base.baseDeed.address,
            0,
            base.UsersRegistryInterface.getWallet.getData(base.buyer),
            bytes32(base.buyer)
        )

        const deposit = web3.toWei(1, 'ether');
        const tx = await base.escrowContract.send(deposit, {from: base.owner});
        const txLogs = parseLogs(base.topics, tx.receipt.logs);
        await base.reverter.snapshot();

        assertLogs(txLogs, [
            {
                address: base.escrowContract.address,
                event: "PaymentReceived",
                args: {
                    move: PAYMENT,
                    who: base.owner,
                    value: deposit
                }
            },
            {
                address: base.escrowContract.address,
                event: "PaymentAssigned",
                args: {
                    move: PAYMENT,
                    unlockAt: OWNERSHIP_TRANSFER,
                    receiver: base.seller,
                    returnTo: base.buyer,
                    value: deposit
                }
            },
            {
                address: base.baseDeed.address,
                event: "MoveDone",
                args: {
                    move: PAYMENT,
                    status: STATUS_SUCCESS
                }
            }
        ]);
    });

    it("should do AFFIDAVIT move", async () => {
        const broker_seller = base.intermediaries[0];
        const broker_buyer = base.intermediaries[1];
        const notary = base.intermediaries[2];
        const title_company_agent = base.intermediaries[3];

        const PURCHASE_AGREEMENT = 1;
        const TITLE_REPORT = 2;
        const SELLER_DISCLOSURES = 3;
        const PAYMENT = 4;
        const AFFIDAVIT = 5;
        const OWNERSHIP_TRANSFER = 6;

        const STATUS_SUCCESS = 1;
        const STATUS_FAIL = 2;

        const tx = await base.baseDeed.action(
            AFFIDAVIT, ["AFFIDAVIT"], [web3.sha3("1")], STATUS_SUCCESS,
            {from: base.seller}
        );
        await base.reverter.snapshot();
        assertLogs(tx.logs, [{
                address: base.baseDeed.address,
                event: "DataProvided",
                args: {who: base.seller}
            },
            {
                address: base.baseDeed.address,
                event: "MoveDone",
                args: {
                    move: AFFIDAVIT,
                    status: STATUS_SUCCESS
                }
        }]);
    });

    it("should do OWNERSHIP_TRANSFER move", async () => {
        const broker_seller = base.intermediaries[0];
        const broker_buyer = base.intermediaries[1];
        const notary = base.intermediaries[2];
        const title_company_agent = base.intermediaries[3];

        const PURCHASE_AGREEMENT = 1;
        const TITLE_REPORT = 2;
        const SELLER_DISCLOSURES = 3;
        const PAYMENT = 4;
        const AFFIDAVIT = 5;
        const OWNERSHIP_TRANSFER = 6;

        const STATUS_SUCCESS = 1;
        const STATUS_FAIL = 2;


        // Get company wallet address
        await base.mock.expect(
            base.baseDeed.address, 0,
            base.ControllerInterface.companyWallet.getData(),
            bytes32(FULL_ADDRESS)
        )
        // Get company fee value
        await base.mock.expect(
            base.baseDeed.address, 0,
            base.FeeCalcInterface.getCompanyFee.getData(base.price),
            bytes32(1)
        )
        // Pay company fee
        await base.mock.expect(
            base.baseDeed.address, 0,
            base.TokenInterface.transferFrom.getData(
                base.baseDeed.address, FULL_ADDRESS, bytes32(1)
            ), 1
        )

        // Get network growth pool wallet address
        await base.mock.expect(
            base.baseDeed.address, 0,
            base.ControllerInterface.networkGrowthPoolWallet.getData(),
            bytes32(FULL_ADDRESS)
        )
        // Get network growth fee value
        await base.mock.expect(
            base.baseDeed.address, 0,
            base.FeeCalcInterface.getNetworkGrowthFee.getData(base.price),
            bytes32(1)
        )
        // Pay network growth fee
        await base.mock.expect(
            base.baseDeed.address, 0,
            base.TokenInterface.transferFrom.getData(
                base.baseDeed.address, FULL_ADDRESS, bytes32(1)
            ), 1
        )

        // Get remainings of PRO tokens at Deed address
        await base.mock.expect(
            base.baseDeed.address, 0,
            base.TokenInterface.balanceOf.getData(base.baseDeed.address),
            bytes32(2)
        )

        // Send 'em back to buyer
        await base.mock.expect(
            base.baseDeed.address, 0,
            base.TokenInterface.transferFrom.getData(
                base.baseDeed.address, base.buyer, bytes32(2)
            ), 1
        )

        // Approve ownership transfer at Property contract
        await base.mock.expect(
            base.baseDeed.address, 0,
            base.PropertyInterface.approveOwnershipTransfer.getData(base.buyer),
            1
        )

        const tx = await base.baseDeed.action(
            OWNERSHIP_TRANSFER, ["OWNERSHIP_TRANSFER"], [web3.sha3("1")], STATUS_SUCCESS,
            {from: title_company_agent}
        );
        const txLogs = parseLogs(base.topics, tx.receipt.logs);
        await base.reverter.snapshot();

        assertLogs(txLogs, [{
                address: base.baseDeed.address,
                event: "DataProvided",
                args: {who: title_company_agent}
            },
            {
                address: base.baseDeed.address,
                event: "FeePaid",
                args: {
                    move: OWNERSHIP_TRANSFER,
                    payer: base.buyer,
                    value: 2
                }
            },
            {
                address: base.baseDeed.address,
                event: "OwnershipTransfer",
                args: {
                    move: OWNERSHIP_TRANSFER,
                    approved: true
                }
            },
            {
                address: base.baseDeed.address,
                event: "MoveDone",
                args: {
                    move: OWNERSHIP_TRANSFER,
                    status: STATUS_SUCCESS
                }
        }]);

        // TODO: Check final balances

    });
*/

}
