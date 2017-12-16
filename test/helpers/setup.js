"use strict";

const Mock = artifacts.require('./Mock.sol');

//const PropertyFactory = artifacts.require("./PropertyFactory.sol");
const MetaDeedFactory = artifacts.require('./MetaDeedFactory.sol');
const BaseDeedFactory = artifacts.require('./BaseDeedFactory.sol');
const EscrowFactory = artifacts.require('./EscrowFactory.sol');

const ControllerInterface = web3.eth.contract(artifacts.require('./PropertyController.sol').abi).at('0x0');
const UsersRegistryInterface = web3.eth.contract(artifacts.require('./UsersRegistry.sol').abi).at('0x0');
const TokenInterface = web3.eth.contract(artifacts.require('./TokenInterface.sol').abi).at('0x0');
const FeeCalcInterface = web3.eth.contract(artifacts.require('./FeeCalc.sol').abi).at('0x0');
const PropertyInterface = web3.eth.contract(artifacts.require('./Property.sol').abi).at('0x0');

const BaseDeed = artifacts.require('./BaseDeed.sol');

const { getSig, instance, ZERO_ADDRESS } = require("./helpers");
const { topics } = require("./contracts");

module.exports = async (base, MetaDeed, deedType, Escrow, escrowType, intermediaries) => {
    base.jurisdiction = deedType;
    base.owner = base.accounts[0];

    base.topics = topics;

    const metaDeedFactory = await MetaDeedFactory.deployed();
    const baseDeedFactory = await BaseDeedFactory.deployed();
    const escrowFactory = await EscrowFactory.deployed();

    base.mock = await Mock.deployed();

    const createMetaDeedTx = await metaDeedFactory.deployContract(deedType, base.mock.address);
    //base.metaDeed = instance(MetaDeed, createMetaDeedTx.logs[0].args.created);
    base.metaDeed = artifacts.require('./MetaDeed' + deedType).at(createMetaDeedTx.logs[0].args.created);

    const createBaseDeedTx = await baseDeedFactory.deployContract(base.metaDeed.address);
    //base.baseDeed = instance(BaseDeed, createBaseDeedTx.logs[0].args.created);
    base.baseDeed = artifacts.require('./BaseDeed').at(createBaseDeedTx.logs[0].args.created);

    const createEscrowTx = await escrowFactory.deployContract(escrowType, base.metaDeed.address, base.baseDeed.address);
    //base.escrowContract = instance(Escrow, createEscrowTx.logs[0].args.created);
    base.escrowContract = artifacts.require('./Escrow' + escrowType).at(createEscrowTx.logs[0].args.created);

    base.ControllerInterface = ControllerInterface;
    base.UsersRegistryInterface = UsersRegistryInterface;
    base.TokenInterface = TokenInterface;
    base.FeeCalcInterface = FeeCalcInterface;
    base.PropertyInterface = PropertyInterface;

    console.log(`${base.metaDeed.address}: MetaDeed${deedType}`);
    console.log(`${base.baseDeed.address}: BaseDeed`);
    console.log(`${base.escrowContract.address}: Escrow${escrowType}`);

    // `reserve` default args
    base.price = web3.toWei(1, 'ether');
    base.seller = base.accounts[1];
    base.buyer = base.accounts[2];
    base.escrow = base.escrowContract.address;
    base.intermediaries = intermediaries;
    base.payments = [base.price];

    base.initialState = {
        status: [{exp: 0}],
        metaDeed: [{exp: base.metaDeed.address}],
        property: [{exp: ZERO_ADDRESS}],
        price: [{exp: 0}],
        seller: [{exp: ZERO_ADDRESS}],
        buyer: [{exp: ZERO_ADDRESS}],
        escrow: [{exp: ZERO_ADDRESS}],
        intermediaries: intermediaries.map(function(item, i) {return {args: [i], exp: "throws"}}),
    }

    await base.reverter.snapshot();
}
