"use strict";

const Promise = require("bluebird");

const { bytes32, ZERO_ADDRESS } = require('../test/helpers/helpers');
const { contracts } = require('../test/helpers/meta').networks.rinkeby;
const { roles } = require('../test/helpers/meta');

const DeedRegistry = artifacts.require('./DeedRegistry.sol');
const FakeCoin = artifacts.require('./FakeCoin.sol');
const FeeCalc = artifacts.require('./FeeCalc.sol');
const Mock = artifacts.require('./Mock.sol');
const PropertyController = artifacts.require("./PropertyController.sol");
const PropertyFactory = artifacts.require("./PropertyFactory.sol");
const PropertyRegistry = artifacts.require('./PropertyRegistry.sol');
const PropertyProxy = artifacts.require('./PropertyProxy.sol');
const Storage = artifacts.require("./Storage.sol");
const StorageInterface = artifacts.require('./StorageInterface.sol');
const StorageManager = artifacts.require('./StorageManager.sol');
const UsersRegistry = artifacts.require('./UsersRegistry.sol');
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');

const allContracts = [
    DeedRegistry,
    FakeCoin,
    FeeCalc,
    PropertyController,
    PropertyFactory,
    PropertyRegistry,
    PropertyProxy,
    Storage,
    StorageInterface,
    StorageManager,
    UsersRegistry,
    MultiEventsHistory,
];

/**
 *
 * @param deployer object : The thing that can deploy contracts
 * @param network  string : Network name, e.g. "live" or "development"
 * @param accounts  array : Array with accounts addresses
 *
 * async/await don't work here as for truffle@3.4.11 т-т
 */
module.exports = async (deployer, network, accounts) => {
    if (network === "rinkeby") {
        const OWNER = accounts[0];

        // STORAGE
        deployer.deploy(Storage)
            .then(() => deployer.deploy(StorageInterface))
            .then(() => deployer.deploy(StorageManager))
            .then(() => StorageManager.deployed())
            .then(() => Storage.deployed())
            .then(storage => storage.setManager(StorageManager.address))

            // MULTI EVENTS HISTORY
            .then(() => deployer.deploy(MultiEventsHistory))

            // FAKE TOKEN
            .then(() => deployer.deploy(FakeCoin))
            .then(() => FakeCoin.deployed())

            // FEE CALC
            .then(() => deployer.deploy(FeeCalc, 100))
            .then(() => FeeCalc.deployed())

            // PROPERTY CONTROLLER
            .then(() => deployer.deploy(
                PropertyController, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS,
                ZERO_ADDRESS, ZERO_ADDRESS, FakeCoin.address, FeeCalc.address
            ))
            .then(() => PropertyController.deployed())

            // PROPERTY PROXY
            .then(() => deployer.deploy(PropertyProxy))
            .then(() => PropertyProxy.deployed())

            // PROPERTY FACTORY
            .then(() => deployer.deploy(PropertyFactory, PropertyController.address, PropertyProxy.address))
            .then(() => PropertyFactory.deployed())

            // PROPERTY REGISTRY
            .then(() => deployer.deploy(
                PropertyRegistry, Storage.address, "PropertyRegistry", PropertyController.address
            ))
            .then(() => PropertyRegistry.deployed())

            // DEED REGISTRY
            .then(() => deployer.deploy(
                DeedRegistry, Storage.address, "DeedRegistry", PropertyController.address
            ))
            .then(() => DeedRegistry.deployed())

            // USERS REGISTRY
            .then(() => deployer.deploy(
                UsersRegistry, Storage.address, "UsersRegistry", PropertyController.address
            ))
            .then(() => UsersRegistry.deployed())

            // AUTHORIZE CONTRACTS AT MULTI EVENTS HISTORY
            .then(() => MultiEventsHistory.deployed())
            .then(history => {
                return Promise.all([
                    history.authorize(StorageManager.address),
                    history.authorize(PropertyController.address),
                    history.authorize(PropertyProxy.address),
                    history.authorize(PropertyFactory.address),
                    history.authorize(PropertyRegistry.address),
                    history.authorize(DeedRegistry.address),
                    history.authorize(UsersRegistry.address),
                ])
            })

            // SETUP MULTI EVENTS HISTORY
            .then(() => StorageManager.deployed())
            .then(instance => instance.setupEventsHistory(MultiEventsHistory.address))
            .then(() => PropertyController.deployed())
            .then(instance => instance.setupEventsHistory(MultiEventsHistory.address))
            .then(() => PropertyProxy.deployed())
            .then(instance => instance.setupEventsHistory(MultiEventsHistory.address))
            .then(() => PropertyFactory.deployed())
            .then(instance => instance.setupEventsHistory(MultiEventsHistory.address))
            .then(() => PropertyRegistry.deployed())
            .then(instance => instance.setupEventsHistory(MultiEventsHistory.address))
            .then(() => DeedRegistry.deployed())
            .then(instance => instance.setupEventsHistory(MultiEventsHistory.address))
            .then(() => UsersRegistry.deployed())
            .then(instance => instance.setupEventsHistory(MultiEventsHistory.address))


            // GIVE ACCESS TO STORAGE
            .then(() => StorageManager.deployed())
            .then(manager => {
                return Promise.all([
                    manager.giveAccess(PropertyRegistry.address, "PropertyRegistry"),
                    manager.giveAccess(DeedRegistry.address, "DeedRegistry"),
                    manager.giveAccess(UsersRegistry.address, "UsersRegistry"),
                ]);
            })
            .then(results => {
                for (let result of results) {
                    if (result) {
                        console.log(result.logs);
                    }
                }
            })


            // SETUP PROPERTY CONTROLLER
            .then(() => PropertyController.deployed())
            .then(controller => {
                return Promise.all([
                    controller.setPropertyProxy(PropertyProxy.address),
                    controller.setPropertyFactory(PropertyFactory.address),
                    controller.setPropertyRegistry(PropertyRegistry.address),
                    controller.setDeedRegistry(DeedRegistry.address),
                    controller.setUsersRegistry(UsersRegistry.address),
                    controller.setFeeWallets(OWNER, OWNER)
                ]);
            })

            // Create user roles
            .then(() => UsersRegistry.deployed())
            .then(usersRegistry => {
                let promises = [];
                for (let role in roles) {
                    promises.push(usersRegistry.defineRole(roles[role]));
                }
                return Promise.all(promises);
            })
            .then(results => {
                for (let result of results) {
                    if (result) {
                        console.log(result.logs);
                    }
                }
            })

            .then(() => {
                console.log('Accounts:');
                for (let account of accounts) {
                    console.log(account);
                }
                console.log('\nEcosystem contracts:');
                for (let contract of allContracts) {
                    console.log(`${contract.address}: ${contract._json.contractName}`);
                }
                console.log();
            })


            .then(() => true);
    }
};
