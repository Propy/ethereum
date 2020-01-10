"use strict";

const Promise = require("bluebird");

const { bytes32} = require('../test/helpers/helpers');
const { contracts, multiSigOwners, parties } = require('../test/helpers/meta').networks.rinkeby;
const { roles } = require('../test/helpers/meta');

const DeedRegistry = artifacts.require('./DeedRegistry.sol');
const DocumentRegistry = artifacts.require('./DocumentRegistry.sol');
const TokenMock = artifacts.require('./TokenMock.sol');
const DocumentFeeCalc = artifacts.require('./DocumentFeeCalc.sol');
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
const RolesLibrary = artifacts.require('./RolesLibrary.sol');
const MultiSigWallet = artifacts.require('./MultiSigWallet.sol');
const AgentDeed = artifacts.require('./AgentDeed.sol');
const ProxyFactory = artifacts.require('./ProxyFactory.sol');

// Title Deed registration
const PoolClonable = artifacts.require('./PoolClonable');
const ProxyClonable = artifacts.require('./ProxyClonable');
const ForwarderClonable = artifacts.require('./ForwarderClonable');
const DoubleSigner = artifacts.require('./DoubleSigner');

const allContracts = [
    DeedRegistry,
    DocumentRegistry,
    TokenMock,
    Mock,
    DocumentFeeCalc, // Used for Deed Registration tool
    FeeCalc, // Used fot Transaction Platform
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
    // Title deed specific
    PoolClonable,
    DoubleSigner,
    AgentDeed,
    ProxyFactory
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function replaceClonable(base, placeholder, clone) {
    //console.log(base._json.bytecode);
    base._json.bytecode = base._json.bytecode.split(placeholder).join(clone.address.slice(-40));
}

/**
 *
 * @param deployer object : The thing that can deploy contracts
 * @param network  string : Network name, e.g. "live" or "development"
 * @param accounts  array : Array with accounts addresses
 *
 * async/await don't work here as for truffle@4.0.4 т-т
 */
module.exports = async (deployer, network, accounts) => {
    console.log(ZERO_ADDRESS);
    if (network === "rinkeby" || network === 'test' || network === "local") {
        const OWNER = accounts[0];

        let storageManager;
        let storage;
        let multiEventsHistory;
        let rolesLibrary;

        let token;
        let feeCalc;
        let documentFeeCalc
        let mock;

        let propertyController;
        let propertyProxy;
        let propertyFactory;
        let propertyRegistry;
        let deedRegistry;
        let usersRegistry;
        let agent;

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
            .then(() => deployer.deploy(RolesLibrary, Storage.address, web3.utils.sha3("RolesLibrary")))
            .then(() => RolesLibrary.deployed())
            .then(instance => {
                rolesLibrary = instance;
            })
            .then(() => storageManager.giveAccess(RolesLibrary.address, web3.utils.sha3("RolesLibrary")))
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

            // MOCK
            .then(() => deployer.deploy(Mock))
            .then(() => Mock.deployed())
            .then(instance => {
                mock = instance;
            })

            // FEE CALC
            .then(() => deployer.deploy(FeeCalc, 100))
            .then(() => FeeCalc.deployed())
            .then(instance => {
                feeCalc = instance;
            })

            // Document FEE CALC
            .then(() => deployer.deploy(DocumentFeeCalc, 200))
            .then(() => DocumentFeeCalc.deployed())
            .then(instance => {
                documentFeeCalc = instance;
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
                PropertyRegistry, Storage.address, web3.utils.sha3("PropertyRegistry"), PropertyController.address, RolesLibrary.address
            ))
            .then(() => PropertyRegistry.deployed())
            .then(instance => {
                propertyRegistry = instance;
            })

            // DEED REGISTRY
            .then(() => deployer.deploy(
                DeedRegistry, Storage.address, web3.utils.sha3("DeedRegistry"), PropertyController.address, RolesLibrary.address
            ))
            .then(() => DeedRegistry.deployed())
            .then(instance => {
                deedRegistry = instance;
            })

            // USERS REGISTRY
            .then(() => deployer.deploy(
                UsersRegistry, Storage.address, web3.utils.sha3("UsersRegistry"), PropertyController.address, RolesLibrary.address
            ))
            .then(() => UsersRegistry.deployed())
            .then(instance => {
                usersRegistry = instance;
            })

            .then(() => console.log("Deploying Title Deed infrastructure..."))
            .then(() => deployer.deploy(DoubleSigner, accounts[0], accounts[1]))
            .then(doubleSigner => doubleSigner.addSigner(accounts[0]))
            .then(() => deployer.deploy(ProxyClonable))
            .then(() => deployer.deploy(ForwarderClonable))
            .then(() => {
                // Replace placeholders with clonable contract addresses
                replaceClonable(PoolClonable, '2231231231231231231231231231231231231232', ProxyClonable);
                replaceClonable(PoolClonable, '1231231231231231231231231231231231231231', ForwarderClonable);
            })
            .then(() => deployer.deploy(PoolClonable, RolesLibrary.address))
            .then(() => deployer.deploy(
                DocumentRegistry, Storage.address, web3.utils.sha3("DocumentRegistry"), OWNER, OWNER, DocumentFeeCalc.address, TokenMock.address, RolesLibrary.address
            ))
            .then(() => deployer.deploy(AgentDeed, PropertyController.address, DocumentRegistry.address))
            .then(instance => {
              agent = instance;
            })
            .then(() => token.mint(agent.address, "1000000000000000"))
            .then(() => rolesLibrary.setRootUser(agent.address, true))

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
                    storageManager.giveAccess(PropertyRegistry.address, web3.utils.sha3("PropertyRegistry")),
                    storageManager.giveAccess(DeedRegistry.address, web3.utils.sha3("DeedRegistry")),
                    storageManager.giveAccess(UsersRegistry.address, web3.utils.sha3("UsersRegistry")),
                ]);
            })
            // .then(results => {
            //     for (let result of results) {
            //         if (result) {
            //             console.log(result.logs);
            //         }
            //     }
            // })


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
                console.log("Defining User Roles...");
                let promises = [];
                for (let role in roles) {
                    promises.push(usersRegistry.defineRole(roles[role]));
                }
                return Promise.all(promises);
            })
            // .then(results => {
            //     for (let result of results) {
            //         if (result) {
            //             console.log(result.logs);
            //         }
            //     }
            // })
            // Register users
            .then(() => Promise.each(Object.keys(parties), party => {
                let { firstname, lastname, role, address } = parties[party];
                console.log("Registering User: " + firstname + " " + lastname);
                //console.log(parties[party]);
                return usersRegistry.create(
                    address,
                    web3.utils.sha3(firstname),
                    web3.utils.sha3(lastname),
                    web3.utils.sha3(role),
                    roles[role],
                    address
                );
            }) .then(
    result => {
      // первая функция-обработчик - запустится при вызове resolve
      console.log("Fulfilled: " + result); // result - аргумент resolve
    },
    error => {
      // вторая функция - запустится при вызове reject
      console.log("Rejected: " + error); // error - аргумент reject
    }))

          //.then(console.log("Deploy MultiSigWallet and force change of contract ownership to it"))

            // Deploy MultiSigWallet and force change of contract ownership to it
            .then(() => deployer.deploy(MultiSigWallet, [OWNER], 1))
            .then(() => storage.forceChangeContractOwnership(MultiSigWallet.address))
            .then(() => storageManager.forceChangeContractOwnership(MultiSigWallet.address))

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
