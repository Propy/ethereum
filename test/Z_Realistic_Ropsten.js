"use strict";

const Mock = artifacts.require('Mock');

const TokenMock = artifacts.require('TokenMock');

const Storage = artifacts.require("Storage");
const StorageInterface = artifacts.require('StorageInterface');
const StorageManager = artifacts.require('StorageManager');
const MultiEventsHistory = artifacts.require('MultiEventsHistory');
const RolesLibrary = artifacts.require('RolesLibrary');

const PropertyController = artifacts.require("PropertyController");
const UsersRegistry = artifacts.require('UsersRegistry');
const PropertyRegistry = artifacts.require('PropertyRegistry');
const DeedRegistry = artifacts.require('DeedRegistry');
const PropertyProxy = artifacts.require('PropertyProxy');
const FeeCalc = artifacts.require('FeeCalc');

const PropertyFactory = artifacts.require("PropertyFactory");
const MetaDeedFactory = artifacts.require('MetaDeedFactory');
const BaseDeedFactory = artifacts.require('BaseDeedFactory');
const EscrowFactory = artifacts.require('EscrowFactory');

const BaseDeed = artifacts.require('BaseDeed');
const MetaDeedUkraine = artifacts.require('MetaDeedUkraine');
const MetaDeedCalifornia = artifacts.require('MetaDeedCalifornia');
const EscrowEther = artifacts.require('EscrowEther');

const Property = artifacts.require('Property');

const MultiSigWallet = artifacts.require('MultiSigWallet');

const { IgnoreAuth } = require('./helpers/mock');


const { assertLogs, equal } = require("./helpers/assert");
const { ZERO_ADDRESS } = require("./helpers/constants");
const { name, parseLogs } = require('./helpers/helpers');
const { roles } = require('./helpers/meta');
const { topics } = require('./helpers/contracts');
const actions = require('./helpers/deeds/actions');

const encodeFunctionCall = require('eth-lightwallet').txutils._encodeFunctionTxData;




contract("Realistic", function (accounts) {

    const owner = accounts[0];
    let ignoreAuth;

    const previousProperty = 0;
    const propertyName = "Simson's House";
    const propertyAddress = "742 Evergreen Terrace";
    const propertyAreaType = 1;  // "meters"
    const propertyArea = 100;

    let mock;

    let tokenMock;

    let storage;
    let storageInterface;
    let storageManager;
    let multiEventsHistory;
    let rolesLibrary;

    let propertyController;
    let usersRegistry;
    let propertyRegistry;
    let deedRegistry;
    let propertyProxy;
    let feeCalc;

    let propertyFactory;
    let metaDeedFactory;
    let baseDeedFactory;
    let escrowFactory;

    let metaDeedCalifornia;
    let metaDeedUkraine;

    let property;

    let multiSigWallet;



    const seller = accounts[0];
    const buyer = accounts[1];


    before('setup', async () => {
        mock = await Mock.deployed();
        ignoreAuth = IgnoreAuth(mock);
        await ignoreAuth(true);  // Just in case

        tokenMock = await TokenMock.deployed();

        storage = await Storage.deployed();
        storageInterface = await StorageInterface.deployed();
        storageManager = await StorageManager.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();
        rolesLibrary = await RolesLibrary.deployed();

        propertyController = await PropertyController.deployed();
        usersRegistry = await UsersRegistry.deployed();
        propertyRegistry = await PropertyRegistry.deployed();
        deedRegistry = await DeedRegistry.deployed();
        propertyProxy = await PropertyProxy.deployed();
        feeCalc = await FeeCalc.deployed();

        propertyFactory = await PropertyFactory.deployed();
        metaDeedFactory = await MetaDeedFactory.deployed();
        baseDeedFactory = await BaseDeedFactory.deployed();
        escrowFactory = await EscrowFactory.deployed();

        multiSigWallet = await MultiSigWallet.deployed();

        metaDeedCalifornia = await MetaDeedCalifornia.deployed();
        equal(await metaDeedCalifornia.controller(), propertyController.address);

        metaDeedUkraine = await MetaDeedUkraine.deployed();
        equal(await metaDeedUkraine.controller(), propertyController.address);
        
        equal(await storage.manager(), storageManager.address);

        for (let emitter of [
            propertyController,
            propertyProxy,
            propertyFactory,
            propertyRegistry,
            deedRegistry,
            usersRegistry
        ]) {
            assert.isTrue(await multiEventsHistory.isAuthorized.call(emitter.address));
            equal(await emitter.getEventsHistory(), multiEventsHistory.address);
        }

        // Check access to storage
        for (let storageUser of [propertyRegistry, deedRegistry, usersRegistry]) {
            assert.isTrue(await storageManager.isAllowed(storageUser.address, name(storageUser)));
        }

        // Check ecosystem contracts addresses at PropertyController

        equal(await propertyController.token(), tokenMock.address);
        equal(await propertyController.feeCalc(), feeCalc.address);
        equal(await propertyController.propertyProxy(), propertyProxy.address);
        equal(await propertyController.propertyFactory(), propertyFactory.address);
        equal(await propertyController.propertyRegistry(), propertyRegistry.address);
        equal(await propertyController.deedRegistry(), deedRegistry.address);
        equal(await propertyController.usersRegistry(), usersRegistry.address);
        equal(await propertyController.companyWallet(), owner);
        equal(await propertyController.networkGrowthPoolWallet(), owner);

        for (let ecosystemContract of [
            propertyProxy,
            propertyFactory,
            propertyRegistry,
            deedRegistry,
            usersRegistry
        ]) {
            equal(await ecosystemContract.controller(), propertyController.address);
        }

        equal(await propertyFactory.proxy(), propertyProxy.address);
    });


    async function registerIntermediaries(intermediaries, intermediariesRoles) {
        for (let i in intermediaries) {
            let userAddress = intermediaries[i];
            let roleName = intermediariesRoles[i];
            if (!roleName.length) continue;
            let role = roles[roleName];

            await usersRegistry.create(
                userAddress, "User", "The " + roleName, roleName, role, userAddress
            );
        }
    }

    async function createBaseDeed(metaDeed) {
        const deploy = encodeFunctionCall("deployContract", ["address"], metaDeed.address);
        let result = await multiSigWallet.submitTransaction(baseDeedFactory.address, 0, deploy);
        let txId = result.logs[1].args.transactionId;
        const createBaseDeedTx = await multiSigWallet.confirmTransaction(txId, {from: accounts[1]});
        return artifacts.require('./BaseDeed').at(createBaseDeedTx.logs[0].args.created);
    }

    async function createEscrow(metaDeed, baseDeed, escrowType, escrowArgs) {
        const deploy = encodeFunctionCall("deployContract", ['address', 'address', 'address'], metaDeed.address, baseDeed.address, ...escrowArgs)
        let result = await multiSigWallet.submitTransaction(escrowFactory.address, 0, deploy);
        let txId = result.logs[1].args.transactionId;
        const createEscrowTx = await multiSigWallet.confirmTransaction(txId, {from: accounts[1]});
        return artifacts.require('./Escrow' + escrowType).at(createEscrowTx.logs[0].args.created);
    }


    async function prepareDeed(metaDeed, escrowType, escrowDepositFunction, escrowArgs, intermediaries, intermediariesRoles, price) {
        const baseDeed = await createBaseDeed(metaDeed);
        const escrow = await createEscrow(metaDeed, baseDeed, escrowType, escrowArgs);

        await registerIntermediaries(intermediaries, intermediariesRoles);
        await reserveDeed(baseDeed, property, price, escrow, intermediaries);
        await tokenMock.mint(baseDeed.address, 10000);

        return {
            property: property,
            metaDeed: metaDeed,
            baseDeed: baseDeed,
            escrowContract: escrow,
            escrowDepositFunction: escrowDepositFunction,
            owner: owner,
            price: price,
            seller: seller,
            buyer: buyer,
            intermediaries: intermediaries,
            topics: topics
        }
    }


    async function reserveDeed(baseDeed, property, price, escrow, intermediaries) {
        const propertyOwner = await property.contractOwner();
        equal(propertyOwner, propertyProxy.address);
        const actualSeller = await property.titleOwner();
        equal(actualSeller, seller);

        const tx = await propertyController.reserveDeed(
            baseDeed.address,
            property.address,
            price,
            seller,
            buyer,
            escrow.address,
            intermediaries,
            [price]
        );
        const txLogs = parseLogs(topics, tx.receipt.logs);

        //console.log(txLogs);
        // TODO: assert logs
    }

    describe("Everything", () => {

        it("should create and register property", async () => {

            const tx = await propertyController.createAndRegisterProperty(
                previousProperty,
                seller,
                propertyName,
                propertyAddress,
                propertyAreaType,
                propertyArea
            );
            const txLogs = parseLogs(topics, tx.receipt.logs);

            assertLogs(txLogs, [
                {
                    address: multiEventsHistory.address,
                    event: "PropertyCreated",
                    args: { self: propertyFactory.address }
                },
                {
                    address: multiEventsHistory.address,
                    event: "PropertyRegistered",
                    args: { self: propertyRegistry.address }
                }
            ]);

            property = Property.at(txLogs[0].args.propertyAddress);
        });


        it("should test MetaDeedCalifornia with EscrowEther", async () => {
            const metaDeed = metaDeedCalifornia;
            const escrowType = "Ether";
            const escrowDepositFunction = "send";

            const intermediaries = [accounts[2], accounts[3], accounts[4], accounts[5]];
            // FIXME: make dynamic
            const intermediariesRoles = [
                "Broker",
                "Broker",
                "Notary",
                "Title company agent"
            ];

            const price = web3.toWei(1, 'ether');

            const base = await prepareDeed(
                metaDeed, escrowType, escrowDepositFunction, [ZERO_ADDRESS], intermediaries, intermediariesRoles, price
            );

            await actions(base);
        });


        it("should test MetaDeedCalifornia with EscrowOracle", async () => {
            const metaDeed = metaDeedCalifornia;
            const escrowType = "Oracle";
            const escrowDepositFunction = "deposit";

            const intermediaries = [accounts[2], accounts[3], accounts[4], accounts[5]];
            // FIXME: make dynamic
            const intermediariesRoles = [
                "Broker",
                "Broker",
                "Notary",
                "Title company agent"
            ];

            const price = web3.toWei(1, 'ether');

            const base = await prepareDeed(
                metaDeed, escrowType, escrowDepositFunction, [owner], intermediaries, intermediariesRoles, price
            );

            await actions(base);
        });


        it("should test MetaDeedUkraine with EscrowEther", async () => {
            const metaDeed = metaDeedUkraine;
            const escrowType = "Ether";
            const escrowDepositFunction = "send";

            const intermediaries = [accounts[3], accounts[4]];
            // FIXME: make dynamic
            const intermediariesRoles = [
                "",
                "Notary",
            ];

            const price = web3.toWei(1, 'ether');

            const base = await prepareDeed(
                metaDeed, escrowType, escrowDepositFunction, [ZERO_ADDRESS], intermediaries, intermediariesRoles, price
            );

            await actions(base);
        });


        it("should test MetaDeedUkraine with EscrowOracle", async () => {
            const metaDeed = metaDeedUkraine;
            const escrowType = "Oracle";
            const escrowDepositFunction = "deposit";

            const intermediaries = [accounts[3], accounts[4]];
            // FIXME: make dynamic
            const intermediariesRoles = [
                "",
                "Notary",
            ];

            const price = web3.toWei(1, 'ether');

            const base = await prepareDeed(
                metaDeed, escrowType, escrowDepositFunction, [owner], intermediaries, intermediariesRoles, price
            );

            await actions(base);
        });
    });

});
