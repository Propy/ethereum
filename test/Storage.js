"use strict";

const ManagerMock = artifacts.require('./ManagerMock.sol');
const Storage = artifacts.require('./Storage.sol');

const Reverter = require('./helpers/reverter');

const { equal, reverts } = require("./helpers/assert");
const { BIGGEST_UINT, ZERO_ADDRESS, ZERO_BYTES32 } = require('./helpers/constants');

contract('Storage', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    let storage;
    let manager;
    const KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const CRATE = 'SomeCrate';

    before('setup', async () => {
        storage = await Storage.new();
        manager = await ManagerMock.new();
        await storage.setManager(manager.address);
        await reverter.snapshot();
    });

    it('should NOT allow to set storage manager by non-owner');  // TODO

    it('should allow owner to set storage manager');  // TODO

    it('should store uint values', async () => {
        const value = web3.toBigNumber(BIGGEST_UINT);
        await storage.setUInt(CRATE, KEY, value);
        const result = await storage.getUInt(CRATE, KEY);
        equal(result, value);
    });

    it('should store address values', async () => {
        const value = '0xffffffffffffffffffffffffffffffffffffffff';
        await storage.setAddress(CRATE, KEY, value);
        const result = await storage.getAddress(CRATE, KEY);
        equal(result, value);
    });

    it('should store bool values', async () => {
        const value = true;
        await storage.setBool(CRATE, KEY, value);
        const result = await storage.getBool(CRATE, KEY);
        equal(result, value);
    });

    it('should store int values', async () => {
        const value = web3.toBigNumber(2).pow(255).sub(1).mul(-1);
        await storage.setInt(CRATE, KEY, value);
        const result = await storage.getInt(CRATE, KEY);
        equal(result, value);
    });

    it('should store bytes32 values', async () => {
        const value = BIGGEST_UINT;
        await storage.setBytes32(CRATE, KEY, value);
        const result = await storage.getBytes32(CRATE, KEY);
        equal(result, value);
    });

    it('should NOT store uint values if not allowed', async () => {
        const value = web3.toBigNumber(BIGGEST_UINT);
        await manager.deny();
        await reverts(storage.setUInt(CRATE, KEY, value));
        const result = await storage.getUInt(CRATE, KEY);
        equal(result, 0);
    });

    it('should NOT store address values if not allowed', async () => {
        const value = '0xffffffffffffffffffffffffffffffffffffffff';
        await manager.deny();
        await reverts(storage.setAddress(CRATE, KEY, value));
        const result = await storage.getAddress(CRATE, KEY);
        equal(result, ZERO_ADDRESS);
    });

    it('should NOT store bool values if not allowed', async () => {
        const value = true;
        await manager.deny();
        await reverts(storage.setBool(CRATE, KEY, value));
        const result = await storage.getBool(CRATE, KEY);
        equal(result, false)
    });

    it('should NOT store int values if not allowed', async () => {
        const value = web3.toBigNumber(2).pow(255).sub(1).mul(-1);
        await manager.deny();
        await reverts(storage.setInt(CRATE, KEY, value));
        const result = await storage.getInt(CRATE, KEY);
        equal(result, 0);
    });

    it('should NOT store bytes32 values if not allowed', async () => {
        const value = BIGGEST_UINT;
        await manager.deny();
        await reverts(storage.setBytes32(CRATE, KEY, value));
        const result = await storage.getBytes32(CRATE, KEY);
        equal(result, ZERO_BYTES32);
    });
});
