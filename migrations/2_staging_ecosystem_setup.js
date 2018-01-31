"use strict";

const Promise = require("bluebird");

const { bytes32, ZERO_ADDRESS } = require('../test/helpers/helpers');
const { contracts } = require('../test/helpers/meta').networks.rinkeby;
const { roles } = require('../test/helpers/meta');

const DeedRegistry = artifacts.require('./DeedRegistry.sol');
const TokenMock = artifacts.require('./TokenMock.sol');
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

const DeployTest = artifacts.require('./DeployTest.sol');

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
    //if (network === "rinkeby") {
    //if (network === "development") {
    if (false) {
        const OWNER = accounts[0];
        const manager = web3.eth.contract(StorageManager.abi).at(contracts.StorageManager.address);
        const usersRegistry = web3.eth.contract(UsersRegistry.abi).at(contracts.UsersRegistry.address);

        deployer.deploy(DeployTest)
            .then(() => {
                let promises = [];
                for (let contract of ["PropertyRegistry", "DeedRegistry", "UsersRegistry"]) {
                    promises.push(manager.giveAccess(contracts[contract].address, contract));
                }
                return Promise.all(promises);
            })
            .then(results => {
                for (result of results) {
                    console.log(result);
                    console.log(result.logs);
                }
            })
            .then(() => {
                let promises = [];
                for (let role of roles) {
                    promises.push(usersRegistry.defineRole(role));
                }
                return Promise.all(promises);
            })
            .then(results => {
                for (result of results) {
                    console.log(result);
                    console.log(result.logs);
                }
            })


            .then(() => true);
    }
};
