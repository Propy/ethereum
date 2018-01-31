"use strict";
const DeedRegistry = artifacts.require('./DeedRegistry.sol');
const TokenMock = artifacts.require('./TokenMock.sol');
const FeeCalc = artifacts.require('./FeeCalc.sol');
const ManagerMock = artifacts.require('./ManagerMock.sol');
const Mock = artifacts.require('./Mock.sol');
const Property = artifacts.require("./Property.sol");
const PropertyController = artifacts.require("./PropertyController.sol");
const PropertyFactory = artifacts.require("./PropertyFactory.sol");
const PropertyRegistry = artifacts.require('./PropertyRegistry.sol');
const PropertyProxy = artifacts.require('./PropertyProxy.sol');
const Storage = artifacts.require("./Storage.sol");
const StorageInterface = artifacts.require('./StorageInterface.sol');
const StorageManager = artifacts.require('./StorageManager.sol');
const StorageTester = artifacts.require('./StorageTester.sol');
const UsersRegistry = artifacts.require('./UsersRegistry.sol');
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');

const DeployTest = artifacts.require('./DeployTest.sol');

const BaseDeed = artifacts.require('./BaseDeed.sol');
const MetaDeedUkraine = artifacts.require('./MetaDeedUkraine.sol');
const MetaDeedCalifornia = artifacts.require('./MetaDeedCalifornia.sol');
const EscrowEther = artifacts.require('./EscrowEther.sol');

const allContracts = {
    DeedRegistry: DeedRegistry,
    TokenMock: TokenMock,
    FeeCalc: FeeCalc,
    ManagerMock: ManagerMock,
    Mock: Mock,
    Property: Property,
    PropertyController: PropertyController,
    PropertyFactory: PropertyFactory,
    PropertyRegistry: PropertyRegistry,
    PropertyProxy: PropertyProxy,
    Storage: Storage,
    StorageInterface: StorageInterface,
    StorageManager: StorageManager,
    StorageTester: StorageTester,
    UsersRegistry: UsersRegistry,
    MultiEventsHistory: MultiEventsHistory,

    DeployTest: DeployTest,

    BaseDeed: BaseDeed,
    MetaDeedUkraine: MetaDeedUkraine,
    MetaDeedCalifornia: MetaDeedCalifornia,
    EscrowEther: EscrowEther,
}


const Promise = require("bluebird");
const { bytes32, getTopics, getSig, parseLogs, ZERO_ADDRESS } = require('../test/helpers/helpers');
const { contracts } = require("../test/helpers/meta").networks.rinkeby;

const topics = getTopics(allContracts);

const deployed = [
    BaseDeed,
    //MetaDeedUkraine,
    MetaDeedCalifornia,
    EscrowEther
];

/**
 *
 * @param deployer object : The thing that can deploy contracts
 * @param network  string : Network name, e.g. "live" or "development"
 * @param accounts  array : Array with accounts addresses
 *
 * async/await don't work here as for truffle@4.0.4 т-т
 */
module.exports = async (deployer, network, accounts) => {
    if (network === "rinkeby") {
        const owner = accounts[0];
        let metaDeed;
        let baseDeed;
        let escrow;

        let controller;
        if (PropertyController.isDeployed()) {
            console.log("Using pre-deployed controller");
            controller = await PropertyController.deployed();
        }
        else {
            console.log("Using controller from network");
            controller = PropertyController.at(contracts.PropertyController.address);
        }

        deployer.deploy(MetaDeedCalifornia, controller.address)
            .then(() => MetaDeedCalifornia.deployed())
            .then(instance => metaDeed = instance)
            .then(() => deployer.deploy(BaseDeed, metaDeed.address))
            .then(() => BaseDeed.deployed())
            .then(instance => baseDeed = instance)
            .then(() => deployer.deploy(EscrowEther, metaDeed.address, baseDeed.address))
            .then(() => EscrowEther.deployed())
            .then(instance => escrow = instance)

            .then(() => controller.createAndRegisterProperty(0, owner, "TestProperty", "221B Baker Street", 1, 100))
            .then(tx => {
                const txLogs = parseLogs(topics, tx.receipt.logs);
                console.log(`${txLogs[0].args.propertyAddress}: Property`);
            })

            .then(() => {
                for (let contract of deployed) {
                    console.log(`${contract.address}: ${contract._json.contractName}`);
                }
                console.log();
            })

            .then(() => true);
    }
};
