"use strict";

const { equal } = require('../test/helpers/assert');
const { bytes32, ZERO_ADDRESS } = require('../test/helpers/helpers');

const Mock = artifacts.require('./Mock.sol');
const ManagerMock = artifacts.require('./ManagerMock.sol');

const TokenMock = artifacts.require('./TokenMock.sol');

const Storage = artifacts.require("./Storage.sol");
const StorageInterface = artifacts.require('./StorageInterface.sol');
const StorageManager = artifacts.require('./StorageManager.sol');
const StorageTester = artifacts.require('./StorageTester.sol');
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const RolesLibrary = artifacts.require('./RolesLibrary.sol');
const MultiSigWallet = artifacts.require('./MultiSigWallet.sol');

const PropertyController = artifacts.require("./PropertyController.sol");
const UsersRegistry = artifacts.require('./UsersRegistry.sol');
const PropertyRegistry = artifacts.require('./PropertyRegistry.sol');
const DeedRegistry = artifacts.require('./DeedRegistry.sol');
const PropertyProxy = artifacts.require('./PropertyProxy.sol');
const FeeCalc = artifacts.require('./FeeCalc.sol');

const PropertyFactory = artifacts.require("./PropertyFactory.sol");
const MetaDeedFactory = artifacts.require('./MetaDeedFactory.sol');
const BaseDeedFactory = artifacts.require('./BaseDeedFactory.sol');
const EscrowFactory = artifacts.require('./EscrowFactory.sol');

const Property = artifacts.require("./Property.sol");
const SimpleDeed = artifacts.require("./SimpleDeed.sol");

const contracts = [
    Mock,
    ManagerMock,

    TokenMock,
    Storage,
    StorageInterface,
    StorageManager,
    StorageTester,
    MultiEventsHistory,

    PropertyController,
    UsersRegistry,
    PropertyRegistry,
    DeedRegistry,
    PropertyProxy,
    FeeCalc,

    PropertyFactory,
    MetaDeedFactory,
    BaseDeedFactory,
    EscrowFactory,
    RolesLibrary,

    Property,
    SimpleDeed
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
    if (network === "development") {
    //if (false) {
        const owner = accounts[0];
        const pseudo_controller = accounts[1];

        deployer.deploy(Mock)
            .then(() => deployer.deploy(TokenMock))

            // Utilities
            .then(() => deployer.deploy(ManagerMock))
            .then(() => deployer.deploy(Storage))
            .then(() => Storage.deployed())
            .then(storage => storage.setManager(ManagerMock.address))

            .then(() => deployer.deploy(StorageInterface))
            .then(() => deployer.deploy(StorageTester, Storage.address, 'StorageTester'))

            .then(() => deployer.deploy(StorageManager, Mock.address))
            .then(() => deployer.deploy(MultiEventsHistory, Mock.address))
            .then(() => deployer.deploy(RolesLibrary, Storage.address, 'RolesLibrary'))

            .then(() => deployer.deploy(FeeCalc, 100))


            // Ecosystem
            .then(() => deployer.deploy(
                PropertyController, Mock.address, Mock.address, Mock.address, Mock.address,
                Mock.address, Mock.address, TokenMock.address, Mock.address
            ))
            .then(() => deployer.deploy(
                PropertyProxy, pseudo_controller, Mock.address
            ))
            .then(() => deployer.deploy(
                PropertyFactory, pseudo_controller, Mock.address, Mock.address
            ))

            .then(() => deployer.deploy(
                PropertyRegistry, Storage.address, "PropertyRegistry", pseudo_controller, Mock.address
            ))
            .then(() => deployer.deploy(
                DeedRegistry, Storage.address, "DeedRegistry", pseudo_controller, Mock.address
            ))
            .then(() => deployer.deploy(
                UsersRegistry, Storage.address, "UsersRegistry", pseudo_controller, Mock.address
            ))

            // Factories
            .then(() => deployer.deploy(MetaDeedFactory))
            .then(() => deployer.deploy(BaseDeedFactory))
            .then(() => deployer.deploy(EscrowFactory))

            .then(() => deployer.deploy(
                Property, ZERO_ADDRESS, owner, "", "", 1, 1
            ))

            .then(() => deployer.deploy(
                SimpleDeed, Property.address, 1000, accounts[0], accounts[1], ["Key"], ["Value"]
            ))

            // MultiSigWallet
            .then(() => deployer.deploy(
                MultiSigWallet, accounts.slice(0, 3), 2
            ))

            .then(() => {
                console.log('Accounts:');
                for (let account of accounts) {
                    console.log(account);
                }
                console.log('\nEcosystem contracts:');
                for (let contract of contracts) {
                    console.log(`${contract.address}: ${contract._json.contractName}`);
                }
                console.log();
            })


            .then(() => true);
    }
};
