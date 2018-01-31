"use strict";

const ManagerMock = artifacts.require('./ManagerMock.sol');
const Mock = artifacts.require('./Mock.sol');
const Storage = artifacts.require('./Storage.sol');
const StorageTester = artifacts.require('./StorageTester.sol');

const Reverter = require('./helpers/reverter');

const { equal, reverts } = require("./helpers/assert");
const { BIGGEST_UINT } = require('./helpers/constants');


contract('StorageInterface', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    let storage;
    let storageTester;
    let mock;

    before('setup', async () => {
        mock = await Mock.deployed();
        storage = await Storage.deployed();
        const managerMock = await ManagerMock.deployed();
        await storage.setManager(managerMock.address);
        storageTester = await StorageTester.deployed();
        await reverter.snapshot();
    });

    it('should store uint values', async () => {
        const value = web3.toBigNumber(BIGGEST_UINT);
        await storageTester.setUInt(value)
        const result = await storageTester.getUInt();
        equal(result, value);
    });

    it('should store address values', async () => {
        const value = '0xffffffffffffffffffffffffffffffffffffffff';
        await storageTester.setAddress(value);
        const result = await storageTester.getAddress();
        equal(result, value);
    });

    it('should store bool values', async () => {
        const value = true;
        await storageTester.setBool(value);
        const result = await storageTester.getBool();
        equal(result, value);
    });

    it('should store int values', async () => {
        const value = web3.toBigNumber(2).pow(255).sub(1).mul(-1);
        await storageTester.setInt(value);
        const result = await storageTester.getInt();
        equal(result, value);
    });

    it('should store bytes32 values', async () => {
        const value = BIGGEST_UINT;
        await storageTester.setBytes32(value);
        const result = await storageTester.getBytes32();
        equal(result, value);
    });

    it('should store bytes32 => bytes32 mapping values', async () => {
        const key = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const value = BIGGEST_UINT;
        await storageTester.setMapping(key, value);
        const result = await storageTester.getMapping(key);
        equal(result, value);
    });

    it('should store address => uint mapping values', async () => {
        const key = '0xffffffffffffffffffffffffffffffffffffffff';
        const value = web3.toBigNumber(BIGGEST_UINT);
        await storageTester.setAddressUIntMapping(key, value);
        const result = await storageTester.getAddressUIntMapping(key);
        equal(result, value);
    });

    it('should store bytes32 set values', async () => {
        const value = BIGGEST_UINT;
        const value2 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00';

        let result;

        await storageTester.addSet(value);

        result = await storageTester.includesSet(value);
        assert.isTrue(result);

        result = await storageTester.includesSet(value2);
        assert.isFalse(result);

        result = await storageTester.countSet();
        equal(result, 1);

        result = await storageTester.getSet();
        assert.equal(result.length, 1);
        assert.equal(result[0], value);

        await storageTester.addSet(value2);
        result = await storageTester.includesSet(value);
        assert.isTrue(result);
        
        result = await storageTester.includesSet(value2);
        assert.isTrue(result);
        
        result = await storageTester.countSet();
        equal(result, 2);

        result = await storageTester.getSet();
        assert.equal(result.length, 2);
        assert.equal(result[0], value);
        assert.equal(result[1], value2);

        await storageTester.removeSet(value);
        result = await storageTester.includesSet(value);
        assert.isFalse(result);

        result = await storageTester.includesSet(value2);
        assert.isTrue(result);

        result = await storageTester.countSet();
        equal(result, 1);
        
        result = await storageTester.getSet();
        assert.equal(result.length, 1);
        assert.equal(result[0], value2);
        
        await storageTester.removeSet(value2);
        result = await storageTester.includesSet(value);
        assert.isFalse(result);
        result = await storageTester.includesSet(value2);
        assert.isFalse(result);
        result = await storageTester.countSet();
        equal(result, 0);
        result = await storageTester.getSet();
        assert.equal(result.length, 0);

    });

    it('should store address set values', async () => {
        const value = '0xffffffffffffffffffffffffffffffffffffffff';
        const value2 = '0xffffffffffffffffffffffffffffffffffffff00';

        let result;

        await storageTester.addAddressesSet(value);
        result = await storageTester.includesAddressesSet(value);
        assert.isTrue(result);

        result = await storageTester.includesAddressesSet(value2);
        assert.isFalse(result);

        result = await storageTester.countAddressesSet();
        equal(result, 1);

        result = await storageTester.getAddressesSet();
        assert.equal(result.length, 1);
        assert.equal(result[0], value);

        await storageTester.addAddressesSet(value2);
        result = await storageTester.includesAddressesSet(value);
        assert.isTrue(result);
        result = await storageTester.includesAddressesSet(value2);
        assert.isTrue(result);
        result = await storageTester.countAddressesSet();
        equal(result, 2);
        result = await storageTester.getAddressesSet();
        assert.equal(result.length, 2);
        assert.equal(result[0], value);
        assert.equal(result[1], value2);

        await storageTester.removeAddressesSet(value);
        result = await storageTester.includesAddressesSet(value);
        assert.isFalse(result);
        result = await storageTester.includesAddressesSet(value2);
        assert.isTrue(result);
        result = await storageTester.countAddressesSet();
        equal(result, 1);
        result = await storageTester.getAddressesSet();
        assert.equal(result.length, 1);
        assert.equal(result[0], value2);

        await storageTester.removeAddressesSet(value2);
        result = await storageTester.includesAddressesSet(value);
        assert.isFalse(result);
        result = await storageTester.includesAddressesSet(value2);
        assert.isFalse(result);
        result = await storageTester.countAddressesSet();
        equal(result, 0);
        result = await storageTester.getAddressesSet();
        assert.equal(result.length, 0);
    });

    it('should not allow repeated variables initialization', () => {
        return reverts(storageTester.reinit());
    });
});
