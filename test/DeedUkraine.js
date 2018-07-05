"use strict";


const BN = require("bignumber.js");

const MetaDeedUkraine = artifacts.require('./MetaDeedUkraine.sol');
const EscrowEther = artifacts.require('./EscrowEther.sol');
const BaseDeed = artifacts.require('./BaseDeed.sol');

const FeeCalc = artifacts.require('./FeeCalc.sol');
const Mock = artifacts.require('./Mock.sol');
const Property = artifacts.require("./Property.sol");
const PropertyController = artifacts.require("./PropertyController.sol");
const UsersRegistry = artifacts.require('./UsersRegistry.sol');

const Asserts = require('./helpers/asserts');
const Reverter = require('./helpers/reverter');

const {
    ZERO_ADDRESS,
    bytes32, assertExpectations, assertLogs, assertState, getSig, equal, parseLogs
} = require("./helpers/helpers");

const { topics } = require("./helpers/contracts");
const reserve = require("./helpers/deeds/reserve");
const setup = require("./helpers/setup");


contract('DeedCalifornia', function(accounts) {
    let base = {};
    base.asserts = Asserts(assert);
    base.reverter = new Reverter(web3);
    base.accounts = accounts;

    afterEach('revert', base.reverter.revert);

    const FeeCalcInterface = web3.eth.contract(FeeCalc.abi).at('0x0');
    const PropertyInterface = web3.eth.contract(Property.abi).at('0x0');
    const ControllerInterface = web3.eth.contract(PropertyController.abi).at('0x0');
    const UsersRegistryInterface = web3.eth.contract(UsersRegistry.abi).at('0x0');
    const BaseDeedInterface = web3.eth.contract(BaseDeed.abi).at('0x0');

    before('setup', async () => {
        await setup(base, MetaDeedUkraine, "Ukraine", EscrowEther, "Ether", [accounts[4], accounts[5]]);
    });

    it("BaseDeed", async () => {
        reserve(base);
    });

    describe("Actions", () => {

    });

});
