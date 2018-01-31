"use strict";

const { FULL_ADDRESS } = require("../constants");
const { assertLogs, throws } = require("../assert");
const { bytes32 } = require('../helpers');
const actions = require("./actions");

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
        await throws(base.baseDeed.action, [1, [], [], 3, {from: base.owner}]);
    });

    it("should check all moves", async () => {


        // Expectations for payments
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


        // Expectations for ownership transfer

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

        await actions(base);


        //assertExpectations(base.mock);
    });

}
