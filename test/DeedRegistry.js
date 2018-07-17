"use strict";

const DeedRegistry = artifacts.require('./DeedRegistry');
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const Mock = artifacts.require('./Mock.sol');

const Reverter = require('./helpers/reverter');

const { assertLogs, equal } = require('./helpers/assert');
const { AssertExpectations, IgnoreAuth, ExpectAuth } = require('./helpers/mock');

contract('DeedRegistry', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);
    
    const owner = accounts[0];
    const unauthorized = accounts[2];
    const controller = accounts[1];
    
    let assertExpectations;
    let ignoreAuth;
    let expectAuth;
    
    let mock;
    let deedRegistry;
    let multiEventsHistory;
    
    before('setup', async () => {
        mock = await Mock.deployed();
        deedRegistry = await DeedRegistry.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();
    
        assertExpectations = AssertExpectations(mock);
        ignoreAuth = IgnoreAuth(mock);
        expectAuth = ExpectAuth(mock);
    
        await ignoreAuth(true);
        
        await deedRegistry.setupEventsHistory(MultiEventsHistory.address);
        await multiEventsHistory.authorize(deedRegistry.address);
        await deedRegistry.setController(controller, {from: owner});
        
        await reverter.snapshot();
    });
    
    describe("Controller setup", () => {
    
        it('should return `false` when set Null controller', async () => {
            let newController = 0;
            assert.isFalse(await deedRegistry.setController.call(newController, {from: owner}));
        });
    
        it('should not allow to set Null controller', async () => {
            let newController = 0;
            await deedRegistry.setController(newController, {from: owner});
            const currentProxy = await deedRegistry.controller.call();
            assert.equal(currentProxy, controller);
        });
    
        it("should check auth when setting controller", async () => {
            const caller = accounts[9];
            const newController = accounts[8];
        
            await ignoreAuth(false);
            await expectAuth(deedRegistry, caller, "setController");
        
            await deedRegistry.setController(newController, {from: caller});
        
            const currentController = await deedRegistry.controller.call();
        
            equal(currentController, controller);
        
        });
        
        it('should emit ServiceChanged after setting controller', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            let result = await deedRegistry.setController(newController, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'ServiceChanged',
                args: {
                    self: deedRegistry.address,
                    name: 'Controller',
                    oldAddress: controller,
                    newAddress: newController
                }
            }]);
        });
    });
    
    describe("Deed register", () => {
    
        it('should return `false` when register Null deed', async () => {
            let deed = '0x0';
            assert.isFalse(await deedRegistry.register.call(deed, {from: controller}));
        });
    
        it('should NOT allow to register null deed', async () => {
            let deed = '0x0';
            await deedRegistry.register(deed, {from: controller});
            assert.isFalse(await deedRegistry.registered(deed));
        });
        
        it('should return `true` when register a deed from controller', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            assert.isTrue(await deedRegistry.register.call(deed, {from: controller}));
        });
        
        it('should return `false` when register a deed from non-controller', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            assert.isFalse(await deedRegistry.register.call(deed, {from: owner}));
        });
        
        it('should allow to register a deed from controller', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            assert.isTrue(await deedRegistry.registered(deed));
        });
    
        it('should NOT allow to register a deed from non-controller', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: owner});
            assert.isFalse(await deedRegistry.registered(deed));
        });
    
        it('should includes a deed after register', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            assert.isTrue(await deedRegistry.includes(deed));
        });
        
        it('should return `false` when register the deed twice', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            assert.isFalse(await deedRegistry.register.call(deed, {from: controller}));
        });
    
        it('should emit DeedRegistered event in MultiEventsHistory on register success', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            let result = await deedRegistry.register(deed, {from: controller});
            
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'DeedRegistered',
                args: {
                    self: deedRegistry.address,
                    addr: deed
                }
            }]);
        });
    
        it('should emit DeedRegistered event twice on register two deeds', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            let deed2 = '0xffffffff0ffffffffffffffffffffffffffffff0';
            let result = await deedRegistry.register(deed, {from: controller});
            let result2 = await deedRegistry.register(deed2, {from: controller});
        
            assertLogs(result.logs, [{
                address: multiEventsHistory.address,
                event: 'DeedRegistered',
                args: {
                    self: deedRegistry.address,
                    addr: deed
                }
            }]);
    
            assertLogs(result2.logs, [{
                address: multiEventsHistory.address,
                event: 'DeedRegistered',
                args: {
                    self: deedRegistry.address,
                    addr: deed2
                }
            }]);
        });
    
        it('should emit Error event in MultiEventsHistory when trying to register deed from unauthorized caller', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            let result = await deedRegistry.register(deed, {from: unauthorized});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: "Error",
                args: {
                    self: DeedRegistry.address,
                    msg: "Unauthorized caller."
                }
            }]);
        });
        
        it('should register all deeds', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            let deed2 = '0xfff0fffffffffffffffffffffffffffffffffff0';
            let deed3 = '0xffffffffffffff0ffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            await deedRegistry.register(deed2, {from: controller});
            await deedRegistry.register(deed3, {from: controller});
            let result = await deedRegistry.getAll();
            assert.equal(result.length, 3);
        });
    });
    
    describe("Deed remove", () => {
    
        it('should NOT allow to remove null deed', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            let nullDeed = '0x0';
            await deedRegistry.register(deed, {from: controller});
            assert.isFalse(await deedRegistry.remove.call(nullDeed, {from: controller}));
        });
    
        it('should return `true` when remove a deed from controller', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            assert.isTrue(await deedRegistry.remove.call(deed, {from: controller}));
        });
    
        it('should return `false` when remove a deed from non-controller', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            assert.isFalse(await deedRegistry.remove.call(deed, {from: owner}));
        });
        
        it('should allow to remove a deed from controller', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            await deedRegistry.remove(deed, {from: controller});
            assert.isFalse(await deedRegistry.registered(deed));
        });
    
        it('should NOT allow to remove a deed from non-controller', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            await deedRegistry.remove(deed, {from: owner});
            assert.isTrue(await deedRegistry.registered(deed));
        });
    
        it('should NOT includes a deed after remove', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            await deedRegistry.remove(deed, {from: controller});
            assert.isFalse(await deedRegistry.includes(deed));
        });
    
        it('should return `false` when remove not registered deed', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            assert.isFalse(await deedRegistry.remove.call(deed, {from: controller}));
        });
        
        it('should emit DeedRemoved event in MultiEventsHistory on remove success', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            let result = await deedRegistry.remove(deed, {from: controller});
            
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'DeedRemoved',
                args: {
                    self: deedRegistry.address,
                    addr: deed
                }
            }]);
        });
    
        it('should emit DeedRemoved event twice on remove two deeds', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            let deed2 = '0xfffffff0fffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            await deedRegistry.register(deed2, {from: controller});
            let result = await deedRegistry.remove(deed, {from: controller});
            let result2 = await deedRegistry.remove(deed2, {from: controller});
        
            assertLogs(result.logs, [{
                address: multiEventsHistory.address,
                event: 'DeedRemoved',
                args: {
                    self: deedRegistry.address,
                    addr: deed
                }
            }]);
    
            assertLogs(result2.logs, [{
                address: multiEventsHistory.address,
                event: 'DeedRemoved',
                args: {
                    self: deedRegistry.address,
                    addr: deed2
                }
            }]);
        });

        // FIXME
        it('should NOT emit DeedRemoved event in MultiEventsHistory on remove fail', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: owner});
            let result = await deedRegistry.remove(deed, {from: controller});
            assert.equal(result.logs.length, 0);
        });
    
        it('should remove all deeds', async () => {
            let deed = '0xfffffffffffffffffffffffffffffffffffffff0';
            let deed2 = '0xfff0fffffffffffffffffffffffffffffffffff0';
            let deed3 = '0xffffffffffffff0ffffffffffffffffffffffff0';
            await deedRegistry.register(deed, {from: controller});
            await deedRegistry.register(deed2, {from: controller});
            await deedRegistry.register(deed3, {from: controller});
    
            await deedRegistry.remove(deed, {from: controller});
            await deedRegistry.remove(deed2, {from: controller});
            await deedRegistry.remove(deed3, {from: controller});
            let result = await deedRegistry.getAll();
            assert.equal(result.length, 0);
        });
    });
});
