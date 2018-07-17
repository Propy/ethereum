"use strict";

const PropertyRegistry = artifacts.require('./PropertyRegistry.sol');
const Mock = artifacts.require('./Mock.sol');
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');

const Reverter = require('./helpers/reverter');

const { assertLogs, equal } = require('./helpers/assert');
const { AssertExpectations, IgnoreAuth, ExpectAuth } = require('./helpers/mock');

contract('PropertyRegistry', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    let assertExpectations;
    let ignoreAuth;
    let expectAuth;

    const owner = accounts[0];
    const unauthorized = accounts[2];
    const controller = accounts[1];

    let mock;
    let propertyRegistry;
    let multiEventsHistory;

    before('setup', async () => {
        mock = await Mock.deployed();
        propertyRegistry = await PropertyRegistry.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();

        assertExpectations = AssertExpectations(mock);
        ignoreAuth = IgnoreAuth(mock);
        expectAuth = ExpectAuth(mock);

        await ignoreAuth(true);

        await propertyRegistry.setupEventsHistory(MultiEventsHistory.address);
        await multiEventsHistory.authorize(propertyRegistry.address);
        await propertyRegistry.setController(controller, {from: owner});
        await reverter.snapshot();
    });

    describe("Controller setup", () => {
    
        it('should return `false` when set Null controller', async () => {
            let newController = 0;
            assert.isFalse(await propertyRegistry.setController.call(newController, {from: owner}));
        });
    
        it('should not allow to set Null controller', async () => {
            let newController = 0;
            await propertyRegistry.setController(newController);
            const currentController = await propertyRegistry.controller.call();
            assert.equal(currentController, controller);
        });

        it("should check auth when setting controller", async () => {
            const caller = accounts[9];
            const newController = accounts[8];

            await ignoreAuth(false);
            await expectAuth(propertyRegistry, caller, "setController");

            await propertyRegistry.setController(newController, {from: caller});

            const currentController = await propertyRegistry.controller.call();

            equal(currentController, controller);

        });


        // `ServiceChanged` event checks
        it('should emit ServiceChanged after setting controller', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            let result = await propertyRegistry.setController(newController, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'ServiceChanged',
                args: {
                    self: propertyRegistry.address,
                    name: 'Controller',
                    oldAddress: controller,
                    newAddress: newController
                }
            }]);
        });
    });


    describe("Register property", () => {
    
        it('should return `false` when set Null property', async () => {
            let property = 0;
            assert.isFalse(await propertyRegistry.register.call(property, {from: controller}));
        });
    
        it('should not allow to set Null property', async () => {
            let property = 0;
            await propertyRegistry.register(property, {from: controller});
            assert.isFalse(await propertyRegistry.relevant(property));
        });

        it('should return `true` when trying to register a property from controller', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyRegistry.register.call(property, {from: controller}));
        });

        it('should return `false` when trying to register a property from non-controller', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            assert.isFalse(await propertyRegistry.register.call(property, {from: owner}));
        });

        it('should allow to register a property from controller', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            assert.isTrue(await propertyRegistry.relevant(property));
        });

        it('should NOT allow to register a property from non-controller', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: owner});
            assert.isFalse(await propertyRegistry.relevant(property));
        });
        
        it('should includes property after register', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            assert.isTrue(await propertyRegistry.includes(property));
        });

        it('should emit PropertyRegistered event twice on register two properties', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            let property2 = '0xffffff00fffffffffffffff0ffffffffffffffff';
            let result = await propertyRegistry.register(property, {from: controller});
            let result2 = await propertyRegistry.register(property2, {from: controller});

            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'PropertyRegistered',
                args: {
                    self: propertyRegistry.address,
                    propertyAddress: property
                }
            }]);
    
            assertLogs(result2.logs, [{
                address: MultiEventsHistory.address,
                event: 'PropertyRegistered',
                args: {
                    self: propertyRegistry.address,
                    propertyAddress: property2
                }
            }]);
        });

        it('should emit Error event in MultiEventsHistory when trying to register from unauthorized caller', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            let result = await propertyRegistry.register(property, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'Error',
                args: {
                    self: PropertyRegistry.address,
                    msg: "Unauthorized caller."
                }
            }]);
        });
        
        it('should get all relevant contracts', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            let property2 = '0xffffff000fffffffffffffffffffffffffffffff';
            let property3 = '0xffffff0000ffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            await propertyRegistry.register(property2, {from: controller});
            await propertyRegistry.register(property3, {from: controller});
            let result = await propertyRegistry.getAllRelevant();
            assert.equal(result.length, 3);
        });

    });


    describe("Remove property", () => {
    
        it('should return `false` when remove Null property', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            let nullProperty = 0;
            await propertyRegistry.register.call(property, {from: controller});
            assert.isFalse(await propertyRegistry.remove.call(nullProperty, false, {from: controller}));
        });
    
        it('should not allow to remove Null property', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            let nullProperty = 0;
            await propertyRegistry.register(property, {from: controller});
            await propertyRegistry.remove(nullProperty, false, {from: controller});
            assert.isFalse(await propertyRegistry.relevant(nullProperty));
        });

        it('should return `true` when trying to remove a property from controller', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            assert.isTrue(await propertyRegistry.remove.call(property, true, {from: controller}));
        });

        it('should return `false` when trying to remove a property from non-controller', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            assert.isFalse(await propertyRegistry.remove.call(property, true, {from: owner}));
        });

        it('should allow to remove a property from controller', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            await propertyRegistry.remove(property, true, {from: controller});
            assert.isFalse(await propertyRegistry.relevant(property));
        });
    
        it('should NOT includes property after remove', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            assert.isTrue(await propertyRegistry.includes(property));
            await propertyRegistry.remove(property, false, {from: controller});
            assert.isFalse(await propertyRegistry.includes(property));
        });
    
        it('should move property to obsolete after migrate', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            assert.isFalse(await propertyRegistry.obsolete(property));
            await propertyRegistry.remove(property, true, {from: controller});
            assert.isTrue(await propertyRegistry.obsolete(property));
        });

        it('should NOT allow to remove a property from non-controller', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            await propertyRegistry.remove(property, false, {from: owner});
            assert.isTrue(await propertyRegistry.relevant(property));
        });

        it('should emit PropertyRemoved event in MultiEventsHistory on removal success', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            let result = await propertyRegistry.remove(property, true, {from: controller});

            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'PropertyRemoved',
                args: {
                    self: propertyRegistry.address,
                    propertyAddress: property
                }
            }]);
        });
    
        it('should emit PropertyRemoved event twice on removal two properties', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            let property2 = '0xffffff00fffffffffff0ffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            await propertyRegistry.register(property2, {from: controller});
            let result = await propertyRegistry.remove(property, true, {from: controller});
            let result2 = await propertyRegistry.remove(property2, true, {from: controller});
        
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'PropertyRemoved',
                args: {
                    self: propertyRegistry.address,
                    propertyAddress: property
                }
            }]);
    
            assertLogs(result2.logs, [{
                address: MultiEventsHistory.address,
                event: 'PropertyRemoved',
                args: {
                    self: propertyRegistry.address,
                    propertyAddress: property2
                }
            }]);
        });

        it('should emit Error event when trying to remove from unauthorized caller', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            let result = await propertyRegistry.remove(property, true, {from: unauthorized});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'Error',
                args: {
                    self: PropertyRegistry.address,
                    msg: 'Unauthorized caller.'
                }
            }]);
        });
    
        it('should get all obsolete contracts', async () => {
            let property = '0xffffff00ffffffffffffffffffffffffffffffff';
            let property2 = '0xffffff000fffffffffffffffffffffffffffffff';
            let property3 = '0xffffff0000ffffffffffffffffffffffffffffff';
            await propertyRegistry.register(property, {from: controller});
            await propertyRegistry.register(property2, {from: controller});
            await propertyRegistry.register(property3, {from: controller});
            
            await propertyRegistry.remove(property, true, {from: controller});
            await propertyRegistry.remove(property2, true, {from: controller});
            await propertyRegistry.remove(property3, true, {from: controller});
            let result = await propertyRegistry.getAllObsolete();
            assert.equal(result.length, 3);
        });

    });

});
