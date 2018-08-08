"use strict";

const Storage = artifacts.require('./Storage.sol');
const StorageManager = artifacts.require('./StorageManager.sol');
const ManagerMock = artifacts.require('./ManagerMock.sol');
const RolesLibrary = artifacts.require('./RolesLibrary.sol');
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const Mock = artifacts.require('./Mock.sol');

const Reverter = require('./helpers/reverter');

const { assertLogs } = require('./helpers/assert');
const { getSigFromName } = require("./helpers/helpers");


contract('RolesLibrary', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);
    
    const owner = accounts[0];
    const unauthorized = accounts[2];

    let storage;
    let multiEventsHistory;
    let rolesLibrary;
    let rolesLibraryInterface = web3.eth.contract(RolesLibrary.abi).at('0x0');
    let mock;
    let managerMock;
    
    const ignoreAuth = (enabled = true) => {
        return mock.ignore(rolesLibraryInterface.canCall.getData(0, 0, 0,).slice(0, 10), enabled);
    };
    
    before('setup', async () => {
        
        mock = await Mock.deployed();
        await ignoreAuth();
        managerMock = await ManagerMock.new();
        storage = await Storage.new();
        
        multiEventsHistory = await MultiEventsHistory.deployed();
        rolesLibrary = await RolesLibrary.deployed();
    
        await storage.setManager(ManagerMock.address);
        await rolesLibrary.setupEventsHistory(multiEventsHistory.address);
        await multiEventsHistory.authorize(rolesLibrary.address);
        
        await reverter.snapshot();
    });
    
    describe('User Roles', function () {
        
        it('should add user role', async () => {
            let user = accounts[1];
            let role = 255;
            
            await rolesLibrary.addUserRole(user, role);
            assert.isTrue(await rolesLibrary.hasUserRole(user, role));
        });
        
        it('should emit RoleAdded event in EventsHistory', async () => {
            let user = accounts[1];
            let role = 255;
            
            let result = await rolesLibrary.addUserRole(user, role, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'RoleAdded',
                args: {
                    self: rolesLibrary.address,
                    user: user,
                    role: role
                }
            }]);
        });
        
        it('should not have user role by default', async () => {
            let user = accounts[1];
            let role = 255;
            
            assert.isFalse(await rolesLibrary.hasUserRole.call(user, role));
           
            await rolesLibrary.addUserRole(user, role - 1, {from: owner});
            assert.isFalse(await rolesLibrary.hasUserRole.call(user, role));
        });
        
        it('should remove user role', async () => {
            let user = accounts[1];
            let role = 255;
           
            await rolesLibrary.addUserRole(user, role, {from: owner});
            await rolesLibrary.removeUserRole(user, role, {from: owner});
            assert.isFalse(await rolesLibrary.hasUserRole.call(user, role));
        });
        
        it('should add user role after removing', async () => {
            let user = accounts[1];
            let role = 255;
            let role2 = role - 1;
            let role3 = role2 - 1;
            
            await rolesLibrary.addUserRole(user, role, {from: owner});
            await rolesLibrary.addUserRole(user, role2, {from: owner});
            await rolesLibrary.removeUserRole(user, role2, {from: owner});
            assert.isFalse(await rolesLibrary.hasUserRole.call(user, role2));
            await rolesLibrary.addUserRole(user, role3, {from: owner});
            assert.isTrue(await rolesLibrary.hasUserRole.call(user, role3));
        });
        
        it('should not allow to call "removeUserRole" for same user role twice', async () => {
            let user = accounts[1];
            let role = 255;
            
            await rolesLibrary.addUserRole(user, role, {from: owner});
            await rolesLibrary.removeUserRole(user, role, {from: owner});
            assert.isFalse(await rolesLibrary.removeUserRole.call(user, role, {from: owner}));
        });
        
        it('should emit RoleRemoved event in EventsHistory', async () => {
            let user = accounts[1];
            let role = 255;
            
            await rolesLibrary.addUserRole(user, role, {from: owner});
            let result = await rolesLibrary.removeUserRole(user, role, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'RoleRemoved',
                args: {
                    self: rolesLibrary.address,
                    user: user,
                    role: role
                }
            }]);
        });
        
        it('should not add user role if not allowed', async () => {
            let user = accounts[1];
            let role = 255;
    
            await rolesLibrary.addUserRole(user, role, {from: unauthorized});
            assert.isFalse(await rolesLibrary.hasUserRole.call(user, role));
        });
        
        it('should add user role if access granted', async () => {
            let user = accounts[1];
            let role = 255;
            let sig = getSigFromName("addUserRole(address,uint8)");
            
            await rolesLibrary.addRoleCapability(1, rolesLibrary.address, sig);
            await rolesLibrary.addUserRole(unauthorized, 1, {from: owner});
            assert.isTrue(await rolesLibrary.hasUserRole.call(unauthorized, 1));
    
            await rolesLibrary.addUserRole(user, role, {from: unauthorized});
            assert.isTrue(await rolesLibrary.hasUserRole.call(user, role));
        });
        
        it('should not remove user role if not allowed', async () => {
            let user = accounts[1];
            let role = 255;
            
            await rolesLibrary.addUserRole(user, role, {from: owner});
            await rolesLibrary.removeUserRole(user, role, {from: unauthorized});
            assert.isTrue(await rolesLibrary.hasUserRole.call(user, role));
        });
        
        it('should add several user roles', async () => {
            let user = accounts[1];
            let role = 255;
            let role2 = 0;
    
            await rolesLibrary.addUserRole(user, role, {from: owner});
            await rolesLibrary.addUserRole(user, role2, {from: owner});
            assert.isTrue(await rolesLibrary.hasUserRole.call(user, role));
            assert.isTrue(await rolesLibrary.hasUserRole.call(user, role2));
        });
        
        it('should differentiate users', async () => {
            let user = accounts[1];
            let user2 = accounts[2];
            let role = 255;
            let role2 = 0;
    
            await rolesLibrary.addUserRole(user, role, {from: owner});
            await rolesLibrary.addUserRole(user2, role2, {from: owner});
            assert.isTrue(await rolesLibrary.hasUserRole.call(user, role));
            assert.isTrue(await rolesLibrary.hasUserRole.call(user2, role2));
            assert.isFalse(await rolesLibrary.hasUserRole.call(user, role2));
            assert.isFalse(await rolesLibrary.hasUserRole.call(user2, role));
        });
        
        it('should return all user roles', async () => {
            let user = accounts[1];
            let role = 255;
            let role2 = 0;
            let role3 = 133;
    
            await rolesLibrary.addUserRole(user, role, {from: owner});
            await rolesLibrary.addUserRole(user, role2, {from: owner});
            await rolesLibrary.addUserRole(user, role3, {from: owner});
            let result = await rolesLibrary.getUserRoles(user, {from: owner});
            assert.equal(result, '0x8000000000000000000000000000002000000000000000000000000000000001');
    
            await rolesLibrary.removeUserRole(user, role2, {from: owner});
            let result2 = await rolesLibrary.getUserRoles(user, {from: owner});
            assert.equal(result2, '0x8000000000000000000000000000002000000000000000000000000000000000');
            
          
        });
        
        it('should not allow to call by default', async () => {
            let user = accounts[1];
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
            
            assert.isFalse(await rolesLibrary.canCall.call(user, code, sig));
        });
        
        it('should not allow to call if has role without capability', async () => {
            let user = accounts[1];
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
            let sig2 = '0xffffff00';
            
            await rolesLibrary.addRoleCapability(role, code, sig2);
            await rolesLibrary.addUserRole(user, role, {from: owner});
            assert.isFalse(await rolesLibrary.canCall.call(user, code, sig));
        });
        
        it('should allow to call if user is root', async () => {
            let user = accounts[1];
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
            
            await rolesLibrary.setRootUser(user, true, {from: owner});
            assert.isTrue(await rolesLibrary.canCall.call(user, code, sig));
        });
        
        it('should allow to call if capability is public', async () => {
            let user = accounts[1];
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
            
            await rolesLibrary.setPublicCapability(code, sig, true, {from: owner});
            assert.isTrue(await rolesLibrary.canCall.call(user, code, sig));
        });
        
        it('should allow to call if has role with capability', async () => {
            let user = accounts[1];
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
    
            await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            await rolesLibrary.addUserRole(user, role, {from: owner});
            assert.isTrue(await rolesLibrary.canCall.call(user, code, sig));
        });
    });
    
    describe('Capabilities', function () {
        it('should add capability', async () => {
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
    
            await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            let result = await rolesLibrary.getCapabilityRoles(code, sig);
            assert.equal(result, '0x8000000000000000000000000000000000000000000000000000000000000000');
        });
        
        it('should emit CapabilityAdded event in EventsHistory', async () => {
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
    
            let result = await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'CapabilityAdded',
                args: {
                    self: rolesLibrary.address,
                    code: code,
                    sig: sig,
                    role: role
                }
            }]);
        });
        
        it('should not have capability by default', async () => {
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
            let sig2 = '0xffffff00';
    
            let result = await rolesLibrary.getCapabilityRoles(code, sig);
            assert.equal(result, '0x0000000000000000000000000000000000000000000000000000000000000000');
    
            await rolesLibrary.addRoleCapability(role, code, sig2, {from: owner});
            let result2 = await rolesLibrary.getCapabilityRoles(code, sig);
            assert.equal(result2, '0x0000000000000000000000000000000000000000000000000000000000000000');
        });
        
        it('should remove capability', async () => {
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
    
            await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            await rolesLibrary.removeRoleCapability(role, code, sig, {from: owner});
            let result = await rolesLibrary.getCapabilityRoles(code, sig);
            assert.equal(result, '0x0000000000000000000000000000000000000000000000000000000000000000');
        });
        
        it('should add capability after removing', async () => {
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
    
            await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            await rolesLibrary.removeRoleCapability(role, code, sig, {from: owner});
            await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            let result = await rolesLibrary.getCapabilityRoles(code, sig);
            assert.equal(result, '0x8000000000000000000000000000000000000000000000000000000000000000');
        });
        
        it('should not allow to call "removeRoleCapability" for same capability twice', async () => {
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
    
            await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            await rolesLibrary.removeRoleCapability(role, code, sig, {from: owner});
            assert.isFalse(await rolesLibrary.removeRoleCapability.call(role, code, sig, {from: owner}));
        });
        
        it('should not allow to call "removeRoleCapability" on start', async () => {
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
    
            assert.isFalse(await rolesLibrary.removeRoleCapability.call(role, code, sig, {from: owner}));
        });
        
        it('should emit CapabilityRemoved event in EventsHistory', async () => {
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
    
            await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            let result = await rolesLibrary.removeRoleCapability(role, code, sig, {from: owner});
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'CapabilityRemoved',
                args: {
                    self: rolesLibrary.address,
                    code: code,
                    sig: sig,
                    role: role
                }
            }]);
        });
        
        it('should not add capability if not allowed', async () => {
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
    
            await rolesLibrary.addRoleCapability(role, code, sig, {from: unauthorized});
            let result = await rolesLibrary.getCapabilityRoles(code, sig);
            assert.equal(result, '0x0000000000000000000000000000000000000000000000000000000000000000');
        });
        
        it('should not remove role if not allowed', async () => {
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
    
            await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            await rolesLibrary.removeRoleCapability(role, code, sig, {from: unauthorized});
            let result = await rolesLibrary.getCapabilityRoles(code, sig);
            assert.equal(result, '0x8000000000000000000000000000000000000000000000000000000000000000');
        });
        
        it('should add several capabilities', async () => {
            let role = 255;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
            let sig2 = '0xffffff00';
    
            await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            await rolesLibrary.addRoleCapability(role, code, sig2, {from: owner});
            let result = await rolesLibrary.getCapabilityRoles(code, sig);
            assert.equal(result, '0x8000000000000000000000000000000000000000000000000000000000000000');
            let result2 = await rolesLibrary.getCapabilityRoles(code, sig2);
            assert.equal(result2, '0x8000000000000000000000000000000000000000000000000000000000000000');
        });
        
        it('should differentiate capabilities', async () => {
            let role = 255;
            let role2 = 0;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
            let sig2 = '0xffffff00';
    
            await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            await rolesLibrary.addRoleCapability(role2, code, sig2, {from: owner});
            let result = await rolesLibrary.getCapabilityRoles(code, sig);
            assert.equal(result, '0x8000000000000000000000000000000000000000000000000000000000000000');
            let result2 = await rolesLibrary.getCapabilityRoles(code, sig2);
            assert.equal(result2, '0x0000000000000000000000000000000000000000000000000000000000000001');
        });
        
        it('should return all roles', async () => {
            let role = 255;
            let role2 = 0;
            let role3 = 131;
            let code = '0xffffffffffffffffffffffffffffffffffffffff';
            let sig = '0xffffffff';
    
            await rolesLibrary.addRoleCapability(role, code, sig, {from: owner});
            await rolesLibrary.addRoleCapability(role2, code, sig, {from: owner});
            await rolesLibrary.addRoleCapability(role3, code, sig, {from: owner});
            let result = await rolesLibrary.getCapabilityRoles(code, sig);
            assert.equal(result, '0x8000000000000000000000000000000800000000000000000000000000000001');
        });
    });
});
