"use strict";

const UsersRegistry = artifacts.require("./UsersRegistry.sol");
const PropertyController = artifacts.require("./PropertyController.sol");
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const Mock = artifacts.require('./Mock.sol');

const Reverter = require('./helpers/reverter');

const { assertLogs, equal, reverts } = require('./helpers/assert');
const { AssertExpectations, IgnoreAuth, ExpectAuth } = require('./helpers/mock');

contract('UsersRegistry', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);
    
    const owner = accounts[0];
    const unauthorized = accounts[2];
    const controller = accounts[5];
    
    const user = accounts[2];
    const firstname = 'Kot';
    const lastname = 'Koteykin';
    const details = 'miow';
    const role = 101;
    const wallet = accounts[8];
    
    let assertExpectations;
    let ignoreAuth;
    let expectAuth;
    
    let usersRegistry;
    let mock;
    let multiEventsHistory;
    
    before('setup', async () => {
        mock = await Mock.deployed();
        usersRegistry = await UsersRegistry.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();
    
        assertExpectations = AssertExpectations(mock);
        ignoreAuth = IgnoreAuth(mock);
        expectAuth = ExpectAuth(mock);
    
        await ignoreAuth(true);
        
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
            equal(currentProxy, controller);
        });
    
        it("should check auth when setting controller", async () => {
            const caller = accounts[9];
            const newController = accounts[8];
        
            await ignoreAuth(false);
            await expectAuth(usersRegistry, caller, "setController");
        
            await usersRegistry.setController(newController, {from: caller});
        
            const currentController = await usersRegistry.controller.call();
        
            equal(currentController, controller);
        
            await assertExpectations();
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
    });
    
    describe("Define role", () => {
    
        it("should check auth when define role", async () => {
            const caller = accounts[9];
        
            await ignoreAuth(false);
            await expectAuth(usersRegistry, caller, "defineRole");
    
            assert.isFalse(await usersRegistry.defineRole.call(role, {from: caller}));
        
            await usersRegistry.defineRole(role, {from: caller});
            await assertExpectations();
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
    });
    
    describe("Create and set user", () => {
    
        it("should check auth when create user", async () => {
            const caller = accounts[9];
        
            await ignoreAuth(false);
            await expectAuth(usersRegistry, caller, "create");
        
            assert.isFalse(await usersRegistry.create.call(
                user, firstname, lastname, details, role, wallet, {from: caller}
            ));
        
            await usersRegistry.create(user, firstname, lastname, details, role, wallet, {from: caller});
            await assertExpectations();
        });
    
        it('should allow to create user', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
            
            let result = await usersRegistry.getUser(user, {from: user});
            equal(web3.toUtf8(result[0]), firstname);
            equal(web3.toUtf8(result[1]), lastname);
            equal(result[2], role);
            equal(result[3], wallet);
        });
    
        it('should revert when create a user and he already exist', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
    
            await reverts(usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            ));
        });
    
        it('should revert when create a user with null parametres', async () => {
            await reverts(usersRegistry.create(
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
            
            equal(web3.toUtf8(result.logs[0].args.firstname), firstname);
            equal(web3.toUtf8(result.logs[0].args.lastname), lastname);
            equal(web3.toUtf8(result.logs[0].args.details), details);
            equal(result.logs[0].args.role, role);
            equal(result.logs[0].args.wallet, wallet);
        });
    });
    
    describe("Update user", () => {
    
        it("should check auth when update user", async () => {
            const caller = accounts[9];
        
            await ignoreAuth(false);
            await expectAuth(usersRegistry, caller, "update");
        
            assert.isFalse(await usersRegistry.update.call(
                user, firstname, lastname, details, role, wallet, {from: caller}
            ));
        
            await usersRegistry.update(user, firstname, lastname, details, role, wallet, {from: caller});
            await assertExpectations();
        });
    
        it('should allow to update user', async () => {
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
            equal(web3.toUtf8(result[0]), newFirstName);
            equal(web3.toUtf8(result[1]), newLastName);
            equal(result[2], newRole);
            equal(result[3], newWallet);
        });
        
        it('should revert when update user and he is not exist', async () => {
            let newFirstName = 'So';
            let newLastName = 'Baseki';
            let newRole = 8;
            let newWallet = accounts[6];
            
            await reverts(usersRegistry.update(
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
    
            equal(web3.toUtf8(result.logs[0].args.firstname), newFirstName);
            equal(web3.toUtf8(result.logs[0].args.lastname), newLastName);
            equal(web3.toUtf8(result.logs[0].args.details), details);
            equal(result.logs[0].args.role, newRole);
            equal(result.logs[0].args.wallet, newWallet);
        });
    });
    
    describe("Remove user", () => {
    
        it("should check auth when remove user", async () => {
            const caller = accounts[9];
        
            await ignoreAuth(false);
            await expectAuth(usersRegistry, caller, "remove");
        
            assert.isFalse(await usersRegistry.remove.call(user, {from: caller}));
        
            await usersRegistry.remove(user, {from: caller});
            await assertExpectations();
        });
    
        it('should allow to remove user', async () => {
            await usersRegistry.create(
                user, firstname, lastname, details, role, wallet, {from: owner}
            );
    
            let result = await usersRegistry.getUser(user, {from: user});
            equal(web3.toUtf8(result[0]), firstname);
            equal(web3.toUtf8(result[1]), lastname);
            equal(result[2], role);
            equal(result[3], wallet);

            await usersRegistry.remove(user, {from: owner});
            let result2 = await usersRegistry.getUser(user, {from: user});
            equal(web3.toUtf8(result2[0]), 0);
            equal(web3.toUtf8(result2[1]), 0);
            equal(result2[2], 0);
            equal(result2[3], 0);
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
        });
    });
});
