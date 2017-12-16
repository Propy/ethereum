"use strict";

const UsersRegistry = artifacts.require("./UsersRegistry.sol");
const PropertyController = artifacts.require("./PropertyController.sol");
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const Mock = artifacts.require('./Mock.sol');

const Asserts = require('./helpers/asserts');
const Reverter = require('./helpers/reverter');

const { ZERO_ADDRESS, assertExpectations, assertLogs, equal, bytes32 } = require('./helpers/helpers');

contract('UsersRegistry', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);
    
    const asserts = Asserts(assert);
    
    const owner = accounts[0];
    const unauthorized = accounts[2];
    const controller = accounts[5];
    
    const user = accounts[2];
    const firstname = 'Kot';
    const lastname = 'Koteykin';
    const details = 'miow';
    const role = 101;
    const wallet = accounts[8];
    
    let usersRegistry;
    let mock;
    let multiEventsHistory;
    
    before('setup', async () => {
        mock = await Mock.deployed();
        usersRegistry = await UsersRegistry.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();
        
        await usersRegistry.setupEventsHistory(MultiEventsHistory.address);
        await multiEventsHistory.authorize(usersRegistry.address);
        
        await usersRegistry.setController(controller, {from: owner});
        await usersRegistry.defineRole(role, {from: owner});
        await reverter.snapshot();
    });
    
    describe("Controller setup", () => {
        
        it('should return `false` when set Null controller', async () => {
            let newController = 0;
            assert.isFalse(await usersRegistry.setController.call(newController, {from: owner}));
        });
        
        it('should not allow to set Null controller', async () => {
            let newController = 0;
            await usersRegistry.setController(newController, {from: owner});
            const currentProxy = await usersRegistry.controller.call();
            assert.equal(currentProxy, controller);
        });
        
        it('should return `true` when setting controller from owner', async () => {
            let controller = '0xffffff0fffffffffffffffffffffffffffffffff';
            assert.isTrue(await usersRegistry.setController.call(controller, {from: owner}));
        });
        
        it('should return `false` when setting controller from non-authorized', async () => {
            let controller = '0xffffff0fffffffffffffffffffffffffffffffff';
            assert.isFalse(await usersRegistry.setController.call(controller, {from: unauthorized}));
        });
        
        it('should allow to set controller from owner', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            await usersRegistry.setController(newController, {from: owner});
            const currentController = await usersRegistry.controller.call();
            assert.equal(currentController, newController);
        });
        
        it('should NOT allow to set controller from not owner', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            await usersRegistry.setController(newController, {from: unauthorized});
            const currentController = await usersRegistry.controller.call();
            assert.equal(currentController, controller);
        });
        
        it('should emit ServiceChanged after setting controller from owner', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            let result = await usersRegistry.setController(newController, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'ServiceChanged',
                args: {
                    self: usersRegistry.address,
                    name: 'Controller',
                    oldAddress: accounts[5],
                    newAddress: newController
                }
            }]);
        });
        
        it('should NOT emit ServiceChanged after setting controller from non-authorized', async () => {
            const newController = '0xffffff0fffffffffffffffffffffffffffffffff';
            let result = await usersRegistry.setController(newController, {from: unauthorized});
            assert.equal(result.logs.length, 0);
        });
    });
    
    describe("Define role", () => {
        
        it('should return `true` when define role from owner', async () => {
            assert.isTrue(await usersRegistry.defineRole.call(role, {from: owner}));
        });
        
        it('should return `false` when define role from unauthorized caller', async () => {
            assert.isFalse(await usersRegistry.defineRole.call(role, {from: unauthorized}));
        });
    
        it('should allow to define role from owner', async () => {
            await usersRegistry.defineRole(role, {from: owner});
            assert.isTrue(await usersRegistry.roleExists(role));
        });
        
        it('should emit RoleDefined in MultiEventsHistory when define role is success', async () => {
            let result = await usersRegistry.defineRole(role, {from: owner});
            
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'RoleDefined',
                args: {
                    self: usersRegistry.address,
                    role: role
                }
            }]);
        });
    
        it('should Not emit event when define role is failed', async () => {
            let result = await usersRegistry.defineRole(role, {from: unauthorized});
            assert.equal(result.logs.length, 0);
        });
    });
    
    describe("Create and set user", () => {
        
        it('should return `true` when create user from owner and from controller', async () => {
            assert.isTrue(await usersRegistry.create.call(
                user, firstname, lastname, details, role, wallet, {from: owner}
            ));
            
            assert.isTrue(await usersRegistry.create.call(
                user, firstname, lastname, details, role, wallet, {from: controller}
            ));
        });
        
        it('should return `false` when create user from unauthorized caller', async () => {
            assert.isFalse(await usersRegistry.create.call(
                user, firstname, lastname, details, role, wallet, {from: unauthorized}
            ));
        });
    
        it('should allow to create user from owner', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
            
            let result = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result[0]), firstname);
            assert.equal(web3.toUtf8(result[1]), lastname);
            assert.equal(result[2], role);
            assert.equal(result[3], wallet);
        });
    
        it('should allow to create user from controller', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: controller}
            );
        
            let result = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result[0]), firstname);
            assert.equal(web3.toUtf8(result[1]), lastname);
            assert.equal(result[2], role);
            assert.equal(result[3], wallet);
        });
    
        it('should Not allow to create user from unauthorized caller', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: unauthorized}
            );
    
            let result = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result[0]), 0);
            assert.equal(web3.toUtf8(result[1]), 0);
            assert.equal(result[2], 0);
            assert.equal(result[3], 0);
        });
    
        it('should throw when create a user and he already exist', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
    
            await asserts.throws(usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            ));
        });
    
        it('should throw when create a user with null parametres', async () => {
            await asserts.throws(usersRegistry.create(
                0, 0, 0, 0, 0, 0, {from: owner}
            ));
        });
    
        it('should emit UserSet in MultiEventsHistory when create user is success', async () => {
            let result = await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
    
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'UserSet',
                args: {
                    self: usersRegistry.address,
                    user: user
                }
            }]);
            
            assert.equal(web3.toUtf8(result.logs[0].args.firstname), firstname);
            assert.equal(web3.toUtf8(result.logs[0].args.lastname), lastname);
            assert.equal(web3.toUtf8(result.logs[0].args.details), details);
            assert.equal(result.logs[0].args.role, role);
            assert.equal(result.logs[0].args.wallet, wallet);
        });
    
        it('should Not emit event when create user is failed', async () => {
            let result = await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: unauthorized}
            );
            assert.equal(result.logs.length, 0);
        });
    });
    
    describe("Update user", () => {
        
        it('should return `true` when update user from owner and from controller', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
            assert.isTrue(await usersRegistry.update.call(
                user, firstname, lastname, details, role, wallet, {from: owner}
            ));
            assert.isTrue(await usersRegistry.update.call(
                user, firstname, lastname, details, role, wallet, {from: controller}
            ));
        });
        
        it('should return `false` when update user from unauthorized caller', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
            assert.isFalse(await usersRegistry.update.call(
                user, firstname, lastname, details, role, wallet, {from: unauthorized}
            ));
        });
    
        it('should allow to update user from owner', async () => {
            let newFirstName = 'So';
            let newLastName = 'Baseki';
            let newRole = 2;
            let newWallet = accounts[6];
            
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
    
            await usersRegistry.defineRole(newRole, {from: owner}); //kostыl'
            await usersRegistry.update(
                user, newFirstName, newLastName, details, newRole, newWallet, {from: owner}
            );
    
            let result = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result[0]), newFirstName);
            assert.equal(web3.toUtf8(result[1]), newLastName);
            assert.equal(result[2], newRole);
            assert.equal(result[3], newWallet);
        });
    
        it('should allow to update user from controller', async () => {
            let newFirstName = 'So';
            let newLastName = 'Baseki';
            let newRole = 8;
            let newWallet = accounts[6];
    
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
    
            await usersRegistry.defineRole(newRole, {from: owner}); //kostыl'
            await usersRegistry.update(
                user, newFirstName, newLastName, details, newRole, newWallet, {from: controller}
            );
    
            let result = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result[0]), newFirstName);
            assert.equal(web3.toUtf8(result[1]), newLastName);
            assert.equal(result[2], newRole);
            assert.equal(result[3], newWallet);
        });
    
        it('should Not allow to update user from from unauthorized caller', async () => {
            let newFirstName = 'So';
            let newLastName = 'Baseki';
            let newRole = 8;
            let newWallet = accounts[6];
    
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
    
            await usersRegistry.defineRole(role, {from: owner}); //kostыl'
            await usersRegistry.update(
                user, newFirstName, newLastName, details, newRole, newWallet, {from: unauthorized}
            );
    
            let result = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result[0]), firstname);
            assert.equal(web3.toUtf8(result[1]), lastname);
            assert.equal(result[2], role);
            assert.equal(result[3], wallet);
        });
    
        it('should throw when update user and he is not exist', async () => {
            let newFirstName = 'So';
            let newLastName = 'Baseki';
            let newRole = 8;
            let newWallet = accounts[6];
            
            await asserts.throws(usersRegistry.update(
                user, newFirstName, newLastName, details, newRole, newWallet, {from: owner}
            ));
        });
    
        it('should emit UserSet in MultiEventsHistory when update is success', async () => {
            let newFirstName = 'So';
            let newLastName = 'Baseki';
            let newRole = 8;
            let newWallet = accounts[6];
    
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
    
            await usersRegistry.defineRole(newRole, {from: owner}); //kostыl'
            let result = await usersRegistry.update(
                user, newFirstName, newLastName, details, newRole, newWallet, {from: owner}
            );
    
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'UserSet',
                args: {
                    self: usersRegistry.address,
                    user: user
                }
            }]);
    
            assert.equal(web3.toUtf8(result.logs[0].args.firstname), newFirstName);
            assert.equal(web3.toUtf8(result.logs[0].args.lastname), newLastName);
            assert.equal(web3.toUtf8(result.logs[0].args.details), details);
            assert.equal(result.logs[0].args.role, newRole);
            assert.equal(result.logs[0].args.wallet, newWallet);
        });
    
        it('should Not emit event when update is failed', async () => {
            let newFirstName = 'So';
            let newLastName = 'Baseki';
            let newRole = 8;
            let newWallet = accounts[6];
    
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
    
            await usersRegistry.defineRole(newRole, {from: owner}); //kostыl'
            let result = await usersRegistry.update(
                user, newFirstName, newLastName, details, newRole, newWallet, {from: unauthorized}
            );
            assert.equal(result.logs.length, 0);
        });
    });
    
    describe("Remove user", () => {
        
        it('should return `true` when remove user from owner and from controller', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: controller}
            );
            
            assert.isTrue(await usersRegistry.remove.call(user, {from: owner}));
        });
        
        it('should return `false` when remove user from unauthorized caller', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: controller}
            );
    
            assert.isFalse(await usersRegistry.remove.call(user, {from: unauthorized}));
        });
    
        it('should allow to remove user from owner', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: controller}
            );
    
            let result = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result[0]), firstname);
            assert.equal(web3.toUtf8(result[1]), lastname);
            assert.equal(result[2], role);
            assert.equal(result[3], wallet);
    
            await usersRegistry.remove(user, {from: owner});
            let result2 = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result2[0]), 0);
            assert.equal(web3.toUtf8(result2[1]), 0);
            assert.equal(result2[2], 0);
            assert.equal(result2[3], 0);
        });
    
        it('should allow to remove user from controller', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: controller}
            );
        
            let result = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result[0]), firstname);
            assert.equal(web3.toUtf8(result[1]), lastname);
            assert.equal(result[2], role);
            assert.equal(result[3], wallet);
    
            await usersRegistry.remove(user, {from: controller});
            let result2 = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result2[0]), 0);
            assert.equal(web3.toUtf8(result2[1]), 0);
            assert.equal(result2[2], 0);
            assert.equal(result2[3], 0);
        });
    
        it('should Not allow to remove user from from unauthorized caller', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: controller}
            );
    
            let result = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result[0]), firstname);
            assert.equal(web3.toUtf8(result[1]), lastname);
            assert.equal(result[2], role);
            assert.equal(result[3], wallet);
    
            await usersRegistry.remove(user, {from: unauthorized});
            let result2 = await usersRegistry.getUser(user, {from: user});
            assert.equal(web3.toUtf8(result2[0]), firstname);
            assert.equal(web3.toUtf8(result2[1]), lastname);
            assert.equal(result2[2], role);
            assert.equal(result2[3], wallet);
        });
    
        it('should emit UserRemoved in MultiEventsHistory when remove user is success', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
    
            let result = await usersRegistry.remove(user, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'UserRemoved',
                args: {
                    self: usersRegistry.address,
                    user: user
                }
            }]);
    
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
    
            let result2 = await usersRegistry.remove(user, {from: controller});
            assertLogs(result2.logs, [{
                address: MultiEventsHistory.address,
                event: 'UserRemoved',
                args: {
                    self: usersRegistry.address,
                    user: user
                }
            }]);
        });
    
        it('should Not emit event when create remove is failed', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: controller}
            );
            let result = await usersRegistry.remove(user, {from: unauthorized});
            assert.equal(result.logs.length, 0);
        });
    });
});
