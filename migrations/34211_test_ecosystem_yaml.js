"use strict";

const Promise = require("bluebird");
const Yaml = require("js-yaml");
const FS = require('fs');

const { bytes32, ZERO_ADDRESS } = require('../test/helpers/helpers');
const { contracts, multiSigOwners, parties } = require('../test/helpers/meta').networks.rinkeby;
const { roles } = require('../test/helpers/meta');

const DeedRegistry = artifacts.require('./DeedRegistry.sol');
const TokenMock = artifacts.require('./TokenMock.sol');
const FeeCalc = artifacts.require('./FeeCalc.sol');
const PropertyController = artifacts.require("./PropertyController.sol");
const PropertyFactory = artifacts.require("./PropertyFactory.sol");
const PropertyRegistry = artifacts.require('./PropertyRegistry.sol');
const PropertyProxy = artifacts.require('./PropertyProxy.sol');
const Storage = artifacts.require("./Storage.sol");
const StorageInterface = artifacts.require('./StorageInterface.sol');
const StorageManager = artifacts.require('./StorageManager.sol');
const UsersRegistry = artifacts.require('./UsersRegistry.sol');
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const RolesLibrary = artifacts.require('./RolesLibrary.sol');
const MultiSigWallet = artifacts.require('./MultiSigWallet.sol');
const Deed = artifacts.require('Deed');
const SimpleDeed = artifacts.require('DeedSimple');
const ProxyFactory = artifacts.require('ProxyFactory');

const allContracts = [
    DeedRegistry,
    TokenMock,
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
    RolesLibrary,
    MultiSigWallet,
    Deed,
    SimpleDeed,
    ProxyFactory
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
    if (network === 'test') {
        const OWNER = accounts[0];

        let storageManager;
        let storage;
        let multiEventsHistory;
        let rolesLibrary;

        let token;
        let feeCalc;

        let propertyController;
        let propertyProxy;
        let propertyFactory;
        let propertyRegistry;
        let deedRegistry;
        let usersRegistry;

        // STORAGE
        deployer.deploy(Storage)
            .then(() => deployer.deploy(StorageInterface))
            .then(() => deployer.deploy(StorageManager))
            .then(() => StorageManager.deployed())
            .then(instance => {
                storageManager = instance;
            })
            .then(() => Storage.deployed())
            .then(instance => {
                storage = instance;
                storage.setManager(StorageManager.address);
            })

            // ROLES LIBRARY
            .then(() => deployer.deploy(RolesLibrary, Storage.address, "RolesLibrary"))
            .then(() => RolesLibrary.deployed())
            .then(instance => {
                rolesLibrary = instance;
            })
            .then(() => storageManager.giveAccess(RolesLibrary.address, "RolesLibrary"))
            .then(() => rolesLibrary.setRootUser(accounts[0], true))


            // MULTI EVENTS HISTORY
            .then(() => deployer.deploy(MultiEventsHistory, RolesLibrary.address))
            .then(() => MultiEventsHistory.deployed())
            .then(instance => {
                multiEventsHistory = instance;
            })
            .then(() => multiEventsHistory.authorize(RolesLibrary.address))
            .then(() => rolesLibrary.setupEventsHistory(MultiEventsHistory.address))


            // FAKE TOKEN
            .then(() => deployer.deploy(TokenMock))
            .then(() => TokenMock.deployed())
            .then(instance => {
                token = instance;
            })

            // FEE CALC
            .then(() => deployer.deploy(FeeCalc, 100))
            .then(() => FeeCalc.deployed())
            .then(instance => {
                feeCalc = instance;
            })

            // PROPERTY CONTROLLER
            .then(() => deployer.deploy(
                PropertyController, RolesLibrary.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS,
                ZERO_ADDRESS, ZERO_ADDRESS, TokenMock.address, FeeCalc.address
            ))
            .then(() => PropertyController.deployed())
            .then(instance => {
                propertyController = instance;
            })

            // PROPERTY PROXY
            .then(() => deployer.deploy(PropertyProxy, PropertyController.address, RolesLibrary.address))
            .then(() => PropertyProxy.deployed())
            .then(instance => {
                propertyProxy = instance;
            })

            // PROPERTY FACTORY
            .then(() => deployer.deploy(PropertyFactory, PropertyController.address, PropertyProxy.address, RolesLibrary.address))
            .then(() => PropertyFactory.deployed())
            .then(instance => {
                propertyFactory = instance;
            })

            // PROPERTY REGISTRY
            .then(() => deployer.deploy(
                PropertyRegistry, Storage.address, "PropertyRegistry", PropertyController.address, RolesLibrary.address
            ))
            .then(() => PropertyRegistry.deployed())
            .then(instance => {
                propertyRegistry = instance;
            })

            // DEED REGISTRY
            .then(() => deployer.deploy(
                DeedRegistry, Storage.address, "DeedRegistry", PropertyController.address, RolesLibrary.address
            ))
            .then(() => DeedRegistry.deployed())
            .then(instance => {
                deedRegistry = instance;
            })

            // USERS REGISTRY
            .then(() => deployer.deploy(
                UsersRegistry, Storage.address, "UsersRegistry", PropertyController.address, RolesLibrary.address
            ))
            .then(() => UsersRegistry.deployed())
            .then(instance => {
                usersRegistry = instance;
            })

            // AUTHORIZE CONTRACTS AT MULTI EVENTS HISTORY
            .then(() => {
                return Promise.all([
                    multiEventsHistory.authorize(PropertyController.address),
                    multiEventsHistory.authorize(PropertyProxy.address),
                    multiEventsHistory.authorize(PropertyFactory.address),
                    multiEventsHistory.authorize(PropertyRegistry.address),
                    multiEventsHistory.authorize(DeedRegistry.address),
                    multiEventsHistory.authorize(UsersRegistry.address),
                ])
            })

            // SETUP MULTI EVENTS HISTORY
            .then(() => propertyController.setupEventsHistory(MultiEventsHistory.address))
            .then(() => propertyProxy.setupEventsHistory(MultiEventsHistory.address))
            .then(() => propertyFactory.setupEventsHistory(MultiEventsHistory.address))
            .then(() => propertyRegistry.setupEventsHistory(MultiEventsHistory.address))
            .then(() => deedRegistry.setupEventsHistory(MultiEventsHistory.address))
            .then(() => usersRegistry.setupEventsHistory(MultiEventsHistory.address))


            // GIVE ACCESS TO STORAGE
            .then(() => {
                return Promise.all([
                    storageManager.giveAccess(PropertyRegistry.address, "PropertyRegistry"),
                    storageManager.giveAccess(DeedRegistry.address, "DeedRegistry"),
                    storageManager.giveAccess(UsersRegistry.address, "UsersRegistry"),
                ]);
            })


            // SETUP PROPERTY CONTROLLER
            .then(() => {
                return Promise.all([
                    propertyController.setPropertyProxy(PropertyProxy.address),
                    propertyController.setPropertyFactory(PropertyFactory.address),
                    propertyController.setPropertyRegistry(PropertyRegistry.address),
                    propertyController.setDeedRegistry(DeedRegistry.address),
                    propertyController.setUsersRegistry(UsersRegistry.address),
                    propertyController.setFeeWallets(OWNER, OWNER)
                ]);
            })

            // Create user roles
            .then(() => {
                let promises = [];
                for (let role in roles) {
                    promises.push(usersRegistry.defineRole(roles[role]));
                }
                return Promise.all(promises);
            })

            // Register users
            .then(() => Promise.each(Object.keys(parties), party => {
                let { firstname, lastname, role, address } = parties[party];
                return usersRegistry.create(
                    address, firstname, lastname, role, roles[role], address
                );
            }))

            // Deploy MultiSigWallet and force change of contract ownership to it
            .then(() => deployer.deploy(MultiSigWallet, [OWNER], 1))
            // INFO: Commented for passing tests
            // .then(() => storage.forceChangeContractOwnership(MultiSigWallet.address))
            // .then(() => storageManager.forceChangeContractOwnership(MultiSigWallet.address))
            .then(() => deployer.deploy(ProxyFactory))
            .then(() => deployer.deploy(Deed, 0))
            .then(() => deployer.deploy(SimpleDeed, 0))

            .then(() => {
                let contracts = {};
                for (let contract of allContracts) {
                    contracts[contract._json.contractName] = contract.address;
                }
                FS.writeFileSync("contracts.yml", Yaml.safeDump(contracts));
            })


            .then(() => true);
    }
};
