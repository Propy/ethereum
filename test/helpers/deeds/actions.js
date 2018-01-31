"use strict";

const { assertLogs } = require("../assert");
const { bn, name, parseLogs, usdPrice } = require("../helpers");


module.exports = async (base) => {
        let TOTAL_GAS_USED = 0;

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

        // Fetch info about each move
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

            for (let i = 1; i <= parties.length; i++) {
                // Check the call from all parties except correct party
            }

            if (move.party !== ESCROW) {
                let args = [];
                for (let a = 1; a <= move.args; a++) {
                    args.push(a.toString());
                }
                let tx = await base.baseDeed.action(
                    m, args, args, 1, {from: parties[move.party]}
                );
                TOTAL_GAS_USED += tx.receipt.gasUsed;
                // TODO: check logs

                const txLogs = parseLogs(base.topics, tx.receipt.logs);
                //console.log(txLogs);

                let logs = [];

                for (let b = 0; b < move.args; b++) {
                    logs.push({
                        address: base.baseDeed.address,
                        event: "DataProvided",
                        args: { who: parties[move.party] }
                    });
                }

                if (move.isFinal) {
                    logs = logs.concat([
                        {
                            address: base.baseDeed.address,
                            event: "FeePaid",
                            args: {
                                move: m,
                                payer: base.buyer,
                                value: 100
                            }
                        },
                        {
                            address: base.property.address,
                            event: "OwnerChanged",
                            args: {
                                property: base.property.address,
                                owner: base.buyer
                            }
                        },
                        {
                            address: base.property.address,
                            event: "StatusChanged",
                            args: {
                                property: base.property.address,
                                to: 0
                            }
                        },
                        {
                            address: base.baseDeed.address,
                            event: "OwnershipTransfer",
                            args: {
                                move: m,
                                approved: true
                            }
                        },
                    ]);
                }

                logs.push({
                    address: base.baseDeed.address,
                    event: "MoveDone",
                    args: {
                        move: m,
                        status: SUCCESS
                    }
                });

                assertLogs(txLogs, logs);


                /*
                // Check that we can't retry the move that is done
                let repeatTx = await base.baseDeed.action(
                    m, args, args, 1, {from: parties[move.party]}
                );
                assertLogs(repeatTx.logs, [{
                    address: base.baseDeed.address,
                    event: "Error",
                    args: { msg: "Move is already done." }
                }]);

                */

            }
            else {
                let currentMoveIndex = await base.escrowContract.currentMoveIndex.call();
                let paymentMove = await base.escrowContract.paymentMoves.call(currentMoveIndex);
                let payment = await base.escrowContract.payments.call(paymentMove);
                let receiverWallet = parties[move.receiver];
                let returnToWallet = parties[move.returnTo];

                let tx = await base.escrowContract[base.escrowDepositFunction](payment, {from: base.owner});
                TOTAL_GAS_USED += tx.receipt.gasUsed;
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

        console.log(
            name(base.metaDeed) + ' + ' +
            name(base.escrowContract) + ' : ' +
            TOTAL_GAS_USED +
            ' (' + await usdPrice(TOTAL_GAS_USED) +' USD)'

        );

        // TODO: test withdraw, check final balances

    }
