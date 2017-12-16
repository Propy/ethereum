"use strict";

const Promise = require("bluebird");

const { bytes32, getSig, ZERO_ADDRESS } = require('../test/helpers/helpers');

const DeedRegistry = artifacts.require('./DeedRegistry.sol');
const FakeCoin = artifacts.require('./FakeCoin.sol');
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

const contracts = [
    Mock,
    BaseDeed,
    MetaDeedUkraine,
    MetaDeedCalifornia,
    EscrowEther
];

const ControllerInterface = web3.eth.contract(PropertyController.abi).at('0x0');
const UsersRegistryInterface = web3.eth.contract(UsersRegistry.abi).at('0x0');

/**
 *
 * @param deployer object : The thing that can deploy contracts
 * @param network  string : Network name, e.g. "live" or "development"
 * @param accounts  array : Array with accounts addresses
 *
 * async/await don't work here as for truffle@3.4.11 т-т
 */
module.exports = async (deployer, network, accounts) => {
    if (network === "development" || network === "main") {
    //if (false) {

        const usersRegistrySig = getSig(ControllerInterface.usersRegistry, []);
        const tokenSig = getSig(ControllerInterface.token, []);
        const feeCalcSig = getSig(ControllerInterface.feeCalc, []);

        const roleExistsSig = getSig(UsersRegistryInterface.roleExists, [0]);
        const getWalletSig = getSig(UsersRegistryInterface.getWallet, [0]);
        const hasRoleSig = getSig(UsersRegistryInterface.hasRole, [0, 0]);

        let mock;
        let metaDeed;

        deployer.deploy(DeployTest)
            .then(() => Mock.deployed())
            .then(instance => mock = instance)
            .then(() => mock.ignore(usersRegistrySig, bytes32(mock.address)))
            .then(() => mock.ignore(tokenSig, bytes32(mock.address)))
            .then(() => mock.ignore(feeCalcSig, bytes32(mock.address)))
            .then(() => mock.ignore(roleExistsSig, true))
            .then(() => mock.ignore(hasRoleSig, true))
            //.then(() => mock.ignore(getWalletSig, bytes32(accounts[8])))

            .then(() => PropertyController.deployed())
            .then(controller => deployer.deploy(MetaDeedCalifornia, controller.address))
            .then(() => MetaDeedCalifornia.deployed())
            .then(instance => {
                metaDeed = instance;
                return deployer.deploy(BaseDeed, metaDeed.address);
            })
            .then(() => BaseDeed.deployed())
            .then(baseDeed => {
                return deployer.deploy(EscrowEther, metaDeed.address, baseDeed.address);
            })

            /*
            .then(() => {
                console.log('\nDeed related contracts:');
                for (let contract of contracts) {
                    console.log(`${contract.address}: ${contract._json.contractName}`);
                }
                console.log();
            })*/


            .then(() => true);
    }
};
