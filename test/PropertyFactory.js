"use strict";

const PropertyFactory = artifacts.require("./PropertyFactory.sol");
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const PropertyController = artifacts.require("./PropertyController.sol");
const Mock = artifacts.require('./Mock.sol');

const Asserts = require('./helpers/asserts');
const Reverter = require('./helpers/reverter');

const {ZERO_ADDRESS, assertExpectations, assertLogs, equal, bytes32} = require('./helpers/helpers');

contract('PropertyFactory', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);
    
    const asserts = Asserts(assert);
    
    const owner = accounts[0];
    const unauthorized = accounts[2];
    const controller = accounts[5];
    
    let propertyFactory;
    let propertyController;
    let multiEventsHistory;
    let mock;
    
    before('setup', async () => {
        mock = await Mock.deployed();
        propertyController = await PropertyController.deployed();
        propertyFactory = await PropertyFactory.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();
        
        await propertyFactory.setupEventsHistory(MultiEventsHistory.address);
        await multiEventsHistory.authorize(propertyFactory.address);
        await propertyFactory.setController(controller, {from: owner});
        
        await reverter.snapshot();
    });
    
    describe("Controller setup", () => {
        
        it('should return `false` when set Null controller', async () => {
            let newController = 0;
            assert.isFalse(await propertyFactory.setController.call(newController, {from: owner}));
        });
        
        it('should not allow to set Null controller', async () => {
            let newController = 0;
            await propertyFactory.setController(newController, {from: owner});
            const currentProxy = await propertyFactory.controller.call();
            assert.equal(currentProxy, controller);
        });
        
        it('should return `true` when setting controller from owner', async () => {
            let controller = '0xffffff0fffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyFactory.setController.call(controller, {from: owner}));
        });
        
        it('should return `false` when setting controller from non-authorized', async () => {
            let controller = '0xffffff0fffffffffffffffffffffffffffffffff';
            assert.isFalse(await propertyFactory.setController.call(controller, {from: unauthorized}));
        });
        
        it('should allow to set controller from owner', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            await propertyFactory.setController(newController, {from: owner});
            const currentController = await propertyFactory.controller.call();
            assert.equal(currentController, newController);
        });
        
        it('should NOT allow to set controller from not owner', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            await propertyFactory.setController(newController, {from: unauthorized});
            const currentController = await propertyFactory.controller.call();
            assert.equal(currentController, controller);
        });
        
        it('should emit ServiceChanged after setting controller from owner', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            let result = await propertyFactory.setController(newController, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'ServiceChanged',
                args: {
                    self: propertyFactory.address,
                    name: 'Controller',
                    oldAddress: accounts[5],
                    newAddress: newController
                }
            }]);
        });
        
        it('should NOT emit ServiceChanged after setting controller from non-authorized', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            let result = await propertyFactory.setController(newController, {from: unauthorized});
            assert.equal(result.logs.length, 0);
        });
    });
    
    describe("Create property", () => {
        
        it('should allow to create property from controller', async () => {
            await propertyFactory.setController(controller, {from: owner});
            let result = await propertyFactory.createProperty.call(ZERO_ADDRESS, owner, "", "", 1, 1, {from: controller});
            assert.notEqual(result, 0);
        });
        
        it('should NOT allow to create property from non-controller', async () => {
            await propertyFactory.setController(controller, {from: owner});
            let result = await propertyFactory.createProperty.call(ZERO_ADDRESS, owner, "", "", 1, 1, {from: unauthorized});
            assert.equal(result, 0);
        });
        
        it('should emit PropertyCreated event in MultiEventsHistory after create success', async () => {
            await propertyFactory.setController(controller, {from: owner});
            const result = await propertyFactory.createProperty(ZERO_ADDRESS, owner, "", "", 1, 1, {from: controller});
            
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'PropertyCreated',
                args: {
                    self: propertyFactory.address
                }
            }]);
        });
        
        it('should emit Error event in MultiEventsHistory when trying to create property from unauthorized caller', async () => {
            await propertyFactory.setController(controller, {from: owner});
            const result = await propertyFactory.createProperty(ZERO_ADDRESS, owner, "", "", 1, 1, {from: unauthorized});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: "Error",
                args: {
                    self: PropertyFactory.address,
                    msg: "Unauthorized caller."
                }
            }]);
        });
    });
    
    describe("Set Proxy", () => {
        
        it('should return `false` when set Null proxy', async () => {
            let newProxy = 0;
            assert.isFalse(await propertyFactory.setProxy.call(newProxy, {from: owner}));
        });
        
        it('should not allow to set Null proxy', async () => {
            let newProxy = 0;
            let lastProxy = await propertyFactory.proxy.call();
            await propertyFactory.setProxy(newProxy, {from: owner});
            const currentProxy = await propertyFactory.proxy.call();
            assert.equal(currentProxy, lastProxy);
        });
        
        it('should return `true` when setting proxy from owner', async () => {
            let proxy = accounts[8];
            assert.isTrue(await propertyFactory.setProxy.call(proxy, {from: owner}));
        });
        
        it('should return `false` when setting proxy from non-authorized', async () => {
            let proxy = accounts[8];
            assert.isFalse(await propertyFactory.setProxy.call(proxy, {from: unauthorized}));
        });
        
        it('should allow to set proxy to owner', async () => {
            let newProxy = accounts[8];
            await propertyFactory.setProxy(newProxy, {from: owner});
            const currentProxy = await propertyFactory.proxy.call();
            assert.equal(currentProxy, newProxy);
        });
        
        it('should NOT allow to set proxy to not owner', async () => {
            let newProxy = accounts[8];
            let lastProxy = await propertyFactory.proxy.call();
            await propertyFactory.setProxy(newProxy, {from: unauthorized});
            const currentProxy = await propertyFactory.proxy.call();
            assert.equal(currentProxy, lastProxy);
        });
    });
});
