"use strict";


const StorageManager = artifacts.require('./StorageManager.sol');
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const Mock = artifacts.require('./Mock.sol');

const Asserts = require('./helpers/asserts');
const Reverter = require('./helpers/reverter');

const { ZERO_ADDRESS, assertExpectations, assertLogs, equal, bytes32 } = require('./helpers/helpers');

contract('StorageManager', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);
    
    const asserts = Asserts(assert);
    let storageManager;
    let multiEventsHistory;
    
    const owner = accounts[0];
    const unauthorized = accounts[2];

    before('setup', async () => {
        storageManager = await StorageManager.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();
        await storageManager.setupEventsHistory(MultiEventsHistory.address);
        await multiEventsHistory.authorize(storageManager.address);
        await reverter.snapshot();
    });
    
    describe("Give Access", () => {
    
        it('should not be accessible when empty', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            assert.isFalse(await storageManager.isAllowed(address, role));
        });
        
        it('should return `true` when give access from owner', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            assert.isTrue(await storageManager.giveAccess.call(address, role, {from: owner}));
        });
        
        it('should return `false` when give access from non-owner', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            assert.isFalse(await storageManager.giveAccess.call(address, role, {from: unauthorized}));
        });
        
        it('should allow owner to give an access', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            assert.isFalse(await storageManager.isAllowed(address, role));
            await storageManager.giveAccess(address, role, {from: owner});
            assert.isTrue(await storageManager.isAllowed(address, role));
        });
    
        it('should NOT allow to give an access by non-owner', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            await storageManager.giveAccess(address, role, {from: unauthorized});
            assert.isFalse(await storageManager.isAllowed(address, role));
        });
    
        it('should NOT allow access for unset actor', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const address2 = accounts[5];
            const role = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

            await storageManager.giveAccess(address, role);
            assert.isTrue(await storageManager.isAllowed(address, role));
            assert.isFalse(await storageManager.isAllowed(address2, role));
        });
        
        it('should NOT allow access for unset roles', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role1 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            const role2 = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        
            await storageManager.giveAccess(address, role1);
            const result_1 = await storageManager.isAllowed(address, role1);
            assert.isTrue(result_1);
            const result_2 = await storageManager.isAllowed(address, role2);
            assert.isFalse(result_2);
        });
    
        it('should emit AccessGiven event in MultiEventsHistory after access is given', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            const result = await storageManager.giveAccess(address, role, {from: owner});
    
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'AccessGiven',
                args: {
                    actor: address,
                    role: role
                }
            }]);
        });

        it('should NOT emit AccessGiven event in MultiEventsHistory after giving access failed', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            const result = await storageManager.giveAccess(address, role, {from: unauthorized});
            assert.equal(result.logs.length, 0);
        });
    });

    describe("Block Access", () => {

        it('should return `true` when block access from owner', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            await storageManager.giveAccess(address, role, {from: owner});
            assert.isTrue(await storageManager.blockAccess.call(address, role, {from: owner}));
        });

        it('should return `false` when block access from non-owner', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            await storageManager.giveAccess(address, role, {from: owner});
            assert.isFalse(await storageManager.blockAccess.call(address, role, {from: unauthorized}));
        });

        it('should block allowed access', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            assert.isFalse(await storageManager.isAllowed(address, role));
            await storageManager.giveAccess(address, role);
            assert.isTrue(await storageManager.isAllowed(address, role));
            await storageManager.blockAccess(address, role);
            assert.isFalse(await storageManager.isAllowed(address, role));
        });

        it('should allow owner to block an access', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            await storageManager.giveAccess(address, role);
            assert.isTrue(await storageManager.isAllowed(address, role, {from: owner}));
            await storageManager.blockAccess(address, role, {from: owner});
            assert.isFalse(await storageManager.isAllowed(address, role, {from: owner}));
        });

        it('should NOT allow to block an access by non-owner', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            await storageManager.giveAccess(address, role, {from: owner});
            const result = await storageManager.isAllowed(address, role);
            assert.isTrue(result);
            await storageManager.blockAccess(address, role, {from: unauthorized});
            const result2 = await storageManager.isAllowed(address, role);
            assert.isTrue(result2); //still allowed because unauthorized can't block access
        });

        it('should not be accessible after access is blocked', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            await storageManager.giveAccess(address, role);
            assert.isTrue(await storageManager.isAllowed(address, role));
            await storageManager.blockAccess(address, role);
            assert.isFalse(await storageManager.isAllowed(address, role));
        });

        it('should emit AccessBlocked event in MultiEventsHistory after access is blocked', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            const result = await storageManager.blockAccess(address, role, {from: owner});

            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'AccessBlocked',
                args: {
                    actor: address,
                    role: role
                }
            }]);
        });
        
        it('should NOT emit AccessBlocked event in MultiEventsHistory after access block is failed', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            const result = await storageManager.blockAccess(address, role, {from: unauthorized});
            assert.equal(result.logs.length, 0);
        });
    });
    
    describe("Correct track", () => {
    
        it('should correctly track changes for different addresses', async () => {
            const address1 = '0xffffffffffffffffffffffffffffffffffffffff';
            const address2 = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
            const address3 = '0xdddddddddddddddddddddddddddddddddddddddd';
            const role = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            await storageManager.giveAccess(address1, role);
            await storageManager.giveAccess(address2, role);
            await storageManager.blockAccess(address2, role);
            await storageManager.giveAccess(address3, role);
        
            const result_1 = await storageManager.isAllowed(address1, role);
            assert.isTrue(result_1);
            const result_2 = await storageManager.isAllowed(address2, role);
            assert.isFalse(result_2);
            const result_3 = await storageManager.isAllowed(address3, role);
            assert.isTrue(result_3);
        });
        
        it('should correctly track changes for different roles', async () => {
            const address = '0xffffffffffffffffffffffffffffffffffffffff';
            const role1 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            const role2 = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
            const role3 = '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
            await storageManager.giveAccess(address, role1);
            await storageManager.giveAccess(address, role2);
            await storageManager.blockAccess(address, role2);
            await storageManager.giveAccess(address, role3);
        
            const result_1 = await storageManager.isAllowed(address, role1);
            assert.isTrue(result_1);
            const result_2 = await storageManager.isAllowed(address, role2);
            assert.isFalse(result_2);
            const result_3 = await storageManager.isAllowed(address, role3);
            assert.isTrue(result_3);
        });
    });
});
