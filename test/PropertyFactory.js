"use strict";

const PropertyFactory = artifacts.require("./PropertyFactory.sol");
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const PropertyController = artifacts.require("./PropertyController.sol");
const Mock = artifacts.require('./Mock.sol');

const Reverter = require('./helpers/reverter');
const { AssertExpectations, IgnoreAuth, ExpectAuth } = require('./helpers/mock');


const { ZERO_ADDRESS } = require("./helpers/constants");
const { assertLogs, equal } = require("./helpers/assert");

contract('PropertyFactory', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);
    
    const owner = accounts[0];
    const unauthorized = accounts[2];
    const controller = accounts[5];
    
    let propertyFactory;
    let propertyController;
    let multiEventsHistory;
    let mock;

    let assertExpectations;
    let ignoreAuth;
    let expectAuth;
    
    before('setup', async () => {
        mock = await Mock.deployed();
        propertyController = await PropertyController.deployed();
        propertyFactory = await PropertyFactory.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();

        assertExpectations = AssertExpectations(mock);
        ignoreAuth = IgnoreAuth(mock);
        expectAuth = ExpectAuth(mock);

        await ignoreAuth(true);
        
        await propertyFactory.setupEventsHistory(MultiEventsHistory.address);
        await multiEventsHistory.authorize(propertyFactory.address);
        await propertyFactory.setController(controller);
        
        await reverter.snapshot();
    });
    
    describe("Controller setup", () => {
        
        it('should return `false` when set Null controller', async () => {
            let newController = 0;
            assert.isFalse(await propertyFactory.setController.call(newController));
        });
        
        it('should not allow to set Null controller', async () => {
            let newController = 0;
            await propertyFactory.setController(newController);
            const currentProxy = await propertyFactory.controller.call();
            assert.equal(currentProxy, controller);
        });

        it("should check auth when setting controller", async () => {
            const caller = accounts[9];
            const newController = accounts[8];

            await ignoreAuth(false);
            await expectAuth(propertyFactory, caller, "setController");

            await propertyFactory.setController(newController, {from: caller});

            const currentController = await propertyFactory.controller.call();

            equal(currentController, controller);

            await assertExpectations();
        });

        it('should return `true` when setting controller', async () => {
            let controller = '0xffffff0fffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyFactory.setController.call(controller));
        });

        it('should allow to set controller', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            await propertyFactory.setController(newController);
            const currentController = await propertyFactory.controller.call();
            assert.equal(currentController, newController);
        });

        
        it('should emit ServiceChanged after setting controller', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            let result = await propertyFactory.setController(newController);
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
    });
    
    describe("Create property", () => {
        
        it('should allow to create property from controller', async () => {
            await propertyFactory.setController(controller);
            let result = await propertyFactory.createProperty.call(ZERO_ADDRESS, owner, "", "", 1, 1, {from: controller});
            assert.notEqual(result, 0);
        });
        
        it('should NOT allow to create property from non-controller', async () => {
            await propertyFactory.setController(controller);
            let result = await propertyFactory.createProperty.call(ZERO_ADDRESS, owner, "", "", 1, 1, {from: unauthorized});
            assert.equal(result, 0);
        });
        
        it('should emit PropertyCreated event in MultiEventsHistory after create success', async () => {
            await propertyFactory.setController(controller);
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
            await propertyFactory.setController(controller);
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
            assert.isFalse(await propertyFactory.setProxy.call(newProxy));
        });
        
        it('should not allow to set Null proxy', async () => {
            let newProxy = 0;
            let lastProxy = await propertyFactory.proxy.call();
            await propertyFactory.setProxy(newProxy);
            const currentProxy = await propertyFactory.proxy.call();
            assert.equal(currentProxy, lastProxy);
        });

        it("should check auth when setting proxy", async () => {
            const caller = accounts[9];
            const newProxy = accounts[8];

            await ignoreAuth(false);
            await expectAuth(propertyFactory, caller, "setProxy");

            await propertyFactory.setProxy(newProxy, {from: caller});

            const currentProxy = await propertyFactory.proxy.call();

            equal(currentProxy, Mock.address);

            await assertExpectations();
        });

        it('should return `true` when setting proxy', async () => {
            let proxy = accounts[8];
            assert.isTrue(await propertyFactory.setProxy.call(proxy));
        });

        
        it('should allow to set proxy', async () => {
            let newProxy = accounts[8];
            await propertyFactory.setProxy(newProxy);
            const currentProxy = await propertyFactory.proxy.call();
            assert.equal(currentProxy, newProxy);
        });
    });
});
