"use strict";

const PropertyProxy = artifacts.require("./PropertyProxy.sol");
const PropertyController = artifacts.require("./PropertyController.sol");
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const Mock = artifacts.require('./Mock.sol');

const Asserts = require('./helpers/asserts');
const Reverter = require('./helpers/reverter');

const { ZERO_ADDRESS, assertExpectations, assertLogs, equal, bytes32 } = require('./helpers/helpers');

contract('PropertyProxy', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);
    
    const asserts = Asserts(assert);

    const owner = accounts[0];
    const unauthorized = accounts[2];
    const controller = accounts[5];
    
    let propertyProxy;
    let mock;
    let multiEventsHistory;
    
    before('setup', async () => {
        mock = await Mock.deployed();
        propertyProxy = await PropertyProxy.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();

        await propertyProxy.setupEventsHistory(MultiEventsHistory.address);
        await multiEventsHistory.authorize(propertyProxy.address);

        await propertyProxy.setController(controller, {from: owner});
        await reverter.snapshot();
    });
    
    describe("Controller setup", () => {
        
        it('should return `false` when set Null controller', async () => {
            let newController = 0;
            assert.isFalse(await propertyProxy.setController.call(newController, {from: owner}));
        });
    
        it('should not allow to set Null controller', async () => {
            let newController = 0;
            await propertyProxy.setController(newController, {from: owner});
            const currentProxy = await propertyProxy.controller.call();
            assert.equal(currentProxy, controller);
        });
    
        it('should return `true` when setting controller from owner', async () => {
            let controller = '0xffffff0fffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyProxy.setController.call(controller, {from: owner}));
        });
    
        it('should return `false` when setting controller from non-authorized', async () => {
            let controller = '0xffffff0fffffffffffffffffffffffffffffffff';
            assert.isFalse(await propertyProxy.setController.call(controller, {from: unauthorized}));
        });
    
        it('should allow to set controller from owner', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            await propertyProxy.setController(newController, {from: owner});
            const currentController = await propertyProxy.controller.call();
            assert.equal(currentController, newController);
        });
    
        it('should NOT allow to set controller from not owner', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            await propertyProxy.setController(newController, {from: unauthorized});
            const currentController = await propertyProxy.controller.call();
            assert.equal(currentController, controller);
        });
    
        it('should emit ServiceChanged after setting controller from owner', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            let result = await propertyProxy.setController(newController, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'ServiceChanged',
                args: {
                    self: propertyProxy.address,
                    name: 'Controller',
                    oldAddress: accounts[5],
                    newAddress: newController
                }
            }]);
        });
    
        it('should NOT emit ServiceChanged after setting controller from non-authorized', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            let result = await propertyProxy.setController(newController, {from: unauthorized});
            assert.equal(result.logs.length, 0);
        });
    });
    
    describe("Set property to pending state", () => {
    
    });
    
    describe("Force property change contract ownership", () => {
    
    });
    
    describe("Migrate property", () => {
    
    });
});
