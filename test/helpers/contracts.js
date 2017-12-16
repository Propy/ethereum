"use strict";


const { getTopics } = require('./helpers');

const contracts = {
    Mock: artifacts.require('./Mock.sol'),
    FakeCoin: artifacts.require('./FakeCoin.sol'),
    ManagerMock: artifacts.require('./ManagerMock.sol'),
    StorageTester: artifacts.require('./StorageTester.sol'),
    DeployTest: artifacts.require('./DeployTest.sol'),
    Storage: artifacts.require("./Storage.sol"),
    StorageInterface: artifacts.require('./StorageInterface.sol'),
    StorageManager: artifacts.require('./StorageManager.sol'),
    UsersRegistry: artifacts.require('./UsersRegistry.sol'),
    MultiEventsHistory: artifacts.require('./MultiEventsHistory.sol'),
    DeedRegistry: artifacts.require('./DeedRegistry.sol'),
    FeeCalc: artifacts.require('./FeeCalc.sol'),
    PropertyController: artifacts.require("./PropertyController.sol"),
    PropertyFactory: artifacts.require("./PropertyFactory.sol"),
    PropertyRegistry: artifacts.require('./PropertyRegistry.sol'),
    PropertyProxy: artifacts.require('./PropertyProxy.sol'),
    Property: artifacts.require("./Property.sol"),
    MetaDeedUkraine: artifacts.require('./MetaDeedUkraine.sol'),
    MetaDeedCalifornia: artifacts.require('./MetaDeedCalifornia.sol'),
    BaseDeed: artifacts.require('./BaseDeed.sol'),
    EscrowEther: artifacts.require('./EscrowEther.sol'),
}



module.exports = {
    contracts: contracts,
    topics: getTopics(contracts),
}
