"use strict";

const PropertyProxy = artifacts.require("./PropertyProxy.sol");
const PropertyController = artifacts.require("./PropertyController.sol");
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const Mock = artifacts.require('./Mock.sol');

const Reverter = require('./helpers/reverter');

const { assertLogs, equal } = require('./helpers/assert');
const { AssertExpectations, IgnoreAuth, ExpectAuth } = require('./helpers/mock');

contract('PropertyProxy', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const owner = accounts[0];
    const controller = accounts[1];
    
    let assertExpectations;
    let ignoreAuth;
    let expectAuth;
    
    let propertyProxy;
    let mock;
    let multiEventsHistory;
    
    before('setup', async () => {
        mock = await Mock.deployed();
        propertyProxy = await PropertyProxy.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();
    
        assertExpectations = AssertExpectations(mock);
        ignoreAuth = IgnoreAuth(mock);
        expectAuth = ExpectAuth(mock);
    
        await ignoreAuth(true);

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
    
        it("should check auth when setting controller", async () => {
            const caller = accounts[9];
            const newController = accounts[8];
        
            await ignoreAuth(false);
            await expectAuth(propertyProxy, caller, "setController");
        
            await propertyProxy.setController(newController, {from: caller});
        
            const currentController = await propertyProxy.controller.call();
        
            equal(currentController, controller);
        
        });
    
        it('should emit ServiceChanged after setting controller', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            let result = await propertyProxy.setController(newController, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'ServiceChanged',
                args: {
                    self: propertyProxy.address,
                    name: 'Controller',
                    oldAddress: controller,
                    newAddress: newController
                }
            }]);
        });
    });
    
    describe("Set property to pending state", () => {
    
    });
    
    describe("Force property change contract ownership", () => {
        
        it("should check auth when change contract ownership", async () => {
            const caller = accounts[9];
            const property = '0xffffffffffffffffffffffffffffffffffffffff';
            const to = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    
            await ignoreAuth(false);
            await expectAuth(propertyProxy, caller, "forcePropertyChangeContractOwnership");
    
            assert.isFalse(await propertyProxy.forcePropertyChangeContractOwnership.call(
                property, to, {from: caller}
            ));
    
        });
    });
    
    describe("Migrate property", () => {
    
    });
});
