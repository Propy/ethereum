"use strict";


const FakeCoin = artifacts.require('./FakeCoin.sol');

const Storage = artifacts.require("./Storage.sol");
const StorageInterface = artifacts.require('./StorageInterface.sol');
const StorageManager = artifacts.require('./StorageManager.sol');
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');

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

const BaseDeed = artifacts.require('./BaseDeed.sol');
const MetaDeedUkraine = artifacts.require('./MetaDeedUkraine.sol');
const MetaDeedCalifornia = artifacts.require('./MetaDeedCalifornia.sol');
const EscrowEther = artifacts.require('./EscrowEther.sol');

const Property = artifacts.require('./Property.sol');

const Asserts = require('./helpers/asserts');
const Reverter = require('./helpers/reverter');


const { ZERO_ADDRESS, assertExpectations, assertLogs, bytes32, equal, name, parseLogs } = require('./helpers/helpers');
const { roles } = require('./helpers/meta').rinkeby;
const { topics } = require('./helpers/contracts');


contract("Realistic", function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const asserts = Asserts(assert);

    const owner = accounts[0];
    const unauthorized = accounts[2];

    const previousProperty = 0;
    const propertyName = "Halabudka";
    const propertyAddress = "221C Tree street";
    const propertyAreaType = 1;  // "meters"
    const propertyArea = 100;

    let fakeCoin;

    let storage;
    let storageInterface;
    let storageManager;
    let multiEventsHistory;

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

    let baseDeed;
    let metaDeedUkraine;
    let metaDeed;
    let escrow;

    let property;


    before('setup', async () => {
        fakeCoin = await FakeCoin.deployed();

        storage = await Storage.deployed();
        storageInterface = await StorageInterface.deployed();
        storageManager = await StorageManager.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();

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

        // Setup deeds
        baseDeed = await BaseDeed.deployed();
        //metaDeedUkraine = await MetaDeedUkraine.deployed();
        metaDeed = await MetaDeedCalifornia.deployed();
        escrow = await EscrowEther.deployed();
        await metaDeed.setController(propertyController.address);
        equal(await metaDeed.controller(), propertyController.address);

        // Set Storage manager
        await storage.setManager(storageManager.address);
        equal(await storage.manager(), storageManager.address);

        for (let emitter of [
            storageManager,
            propertyController,
            propertyProxy,
            propertyFactory,
            propertyRegistry,
            deedRegistry,
            usersRegistry
        ]) {
            // Authorize emitter contracts at MultiEventsHistory
            await multiEventsHistory.authorize(emitter.address);
            assert.isTrue(await multiEventsHistory.isAuthorized.call(emitter.address));

            // Setup events history at emitter contracts
            await emitter.setupEventsHistory(multiEventsHistory.address);
            equal(await emitter.getEventsHistory(), multiEventsHistory.address);
        }

        // Give and check access to storage
        for (let storageUser of [propertyRegistry, deedRegistry, usersRegistry]) {
            await storageManager.giveAccess(storageUser.address, name(storageUser));
            assert.isTrue(await storageManager.isAllowed(storageUser.address, name(storageUser)));
        }

        // Set and check ecosystem contracts addresses at PropertyController
        await propertyController.setFeeCalc(feeCalc.address);
        await propertyController.setPropertyProxy(propertyProxy.address);
        await propertyController.setPropertyFactory(propertyFactory.address);
        await propertyController.setPropertyRegistry(propertyRegistry.address);
        await propertyController.setDeedRegistry(deedRegistry.address);
        await propertyController.setUsersRegistry(usersRegistry.address);
        await propertyController.setFeeWallets(owner, owner);

        equal(await propertyController.token(), fakeCoin.address);
        equal(await propertyController.feeCalc(), feeCalc.address);
        equal(await propertyController.propertyProxy(), propertyProxy.address);
        equal(await propertyController.propertyFactory(), propertyFactory.address);
        equal(await propertyController.propertyRegistry(), propertyRegistry.address);
        equal(await propertyController.deedRegistry(), deedRegistry.address);
        equal(await propertyController.usersRegistry(), usersRegistry.address);
        equal(await propertyController.companyWallet(), owner);
        equal(await propertyController.networkGrowthPoolWallet(), owner);

        // Setup controller at ecosystem contracts
        for (let ecosystemContract of [
            propertyProxy,
            propertyFactory,
            propertyRegistry,
            deedRegistry,
            usersRegistry
        ]) {
            await ecosystemContract.setController(propertyController.address);
            equal(await ecosystemContract.controller(), propertyController.address);
        }

        await propertyFactory.setProxy(propertyProxy.address);
        equal(await propertyFactory.proxy(), propertyProxy.address);


        // Define default roles
        for (let r in roles) {
            await usersRegistry.defineRole(roles[r]);
            assert.isTrue(await usersRegistry.roleExists(roles[r]));
            console.log(`Role defined: ${r} (${roles[r]})`);
        }




        await reverter.snapshot();
    });

    it("should create and register property", async () => {
        const tx = await propertyController.createAndRegisterProperty(
            previousProperty, owner, propertyName, propertyAddress,
            propertyAreaType, propertyArea
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
        await reverter.snapshot();
    });

    it("should reserve deed", async () => {
        const propertyOwner = await property.contractOwner();
        equal(propertyOwner, propertyProxy.address);
        const seller = await property.titleOwner();
        equal(seller, owner);
        const price = web3.toWei(1, 'ether');
        const buyer = accounts[1];
        const intermediaries = [accounts[2], accounts[3], accounts[4], accounts[5]];
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
        console.log(tx);
        const txLogs = parseLogs(topics, tx.receipt.logs);
        console.log(txLogs);
    });


})
