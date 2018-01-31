"use strict";

const Mock = artifacts.require('./Mock.sol');

const TokenMock = artifacts.require('./TokenMock.sol');

const Storage = artifacts.require("./Storage.sol");
const StorageInterface = artifacts.require('./StorageInterface.sol');
const StorageManager = artifacts.require('./StorageManager.sol');
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const RolesLibrary = artifacts.require('./RolesLibrary.sol');

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

const Reverter = require('./helpers/reverter');
const { IgnoreAuth } = require('./helpers/mock');


const { assertLogs, equal } = require("./helpers/assert");
const { ZERO_ADDRESS } = require("./helpers/constants");
const { name, parseLogs } = require('./helpers/helpers');
const { roles } = require('./helpers/meta');
const { topics } = require('./helpers/contracts');
const actions = require('./helpers/deeds/actions');




contract("Realistic", function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const owner = accounts[0];
    const unauthorized = accounts[2];
    let ignoreAuth;

    const previousProperty = 0;
    const propertyName = "Halabudka";
    const propertyAddress = "221C Tree street";
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



    const seller = accounts[1];
    const buyer = accounts[2];


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

        // Setup deeds
        metaDeedCalifornia = await MetaDeedCalifornia.deployed();
        await metaDeedCalifornia.setController(propertyController.address);
        equal(await metaDeedCalifornia.controller(), propertyController.address);

        metaDeedUkraine = await MetaDeedUkraine.deployed();
        await metaDeedUkraine.setController(propertyController.address);
        equal(await metaDeedUkraine.controller(), propertyController.address);

        await rolesLibrary.setRootUser(accounts[0], true);
        await propertyController.setRolesLibrary(rolesLibrary.address);
        await usersRegistry.setRolesLibrary(rolesLibrary.address);
        await multiEventsHistory.setRolesLibrary(rolesLibrary.address);
        await propertyFactory.setRolesLibrary(rolesLibrary.address);
        await propertyProxy.setRolesLibrary(rolesLibrary.address);
        await deedRegistry.setRolesLibrary(rolesLibrary.address);
        await propertyRegistry.setRolesLibrary(rolesLibrary.address);
        

        // Set Storage manager
        await storage.setManager(storageManager.address);
        equal(await storage.manager(), storageManager.address);

        for (let emitter of [
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

        equal(await propertyController.token(), tokenMock.address);
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


        // Register seller
        const createUserTx = await usersRegistry.create(
            seller, "User", "The Seller", "User", roles["User"], seller
        )
        console.log('User creation gas used: ' + createUserTx.receipt.gasUsed)

        // Register buyer
        await usersRegistry.create(
            buyer, "User", "The Buyer", "User", roles["User"], buyer
        )

        await reverter.snapshot();
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
        const createBaseDeedTx = await baseDeedFactory.deployContract(metaDeed.address);
        console.log('Gas used for base deed creation: ' + createBaseDeedTx.receipt.gasUsed);
        return artifacts.require('./BaseDeed').at(createBaseDeedTx.logs[0].args.created);
    }

    async function createEscrow(metaDeed, baseDeed, escrowType, escrowArgs) {
        const createEscrowTx = await escrowFactory.deployContract(escrowType, metaDeed.address, baseDeed.address, ...escrowArgs);
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
        console.log('Gas used for base deed reservation: ' + tx.receipt.gasUsed);
        const txLogs = parseLogs(topics, tx.receipt.logs);

        //console.log(txLogs);
        // TODO: assert logs
    }


    describe("UsersRegistry", () => {

        it("should not let conduct restricted operations from non-authorized caller", async () => {
            assert.isFalse(await usersRegistry.setRolesLibrary.call(1, {from: unauthorized}));
            assert.isFalse(await usersRegistry.setController.call(owner, {from: unauthorized}));
            assert.isFalse(await usersRegistry.defineRole.call(101, {from: unauthorized}));
            assert.isFalse(await usersRegistry.create.call(
                accounts[9],
                "Kot",
                "Koteikin",
                "Something",
                2,
                accounts[9],
                {from: unauthorized}
            ));
            await usersRegistry.create(
                accounts[9],
                "Kot",
                "Koteikin",
                "Something",
                2,
                accounts[9],
                {from: owner}
            )
            assert.isFalse(await usersRegistry.update.call(
                accounts[9],
                "Kot",
                "Koteikin",
                "Something",
                4,
                accounts[9],
                {from: unauthorized}
            ));
            assert.isFalse(await usersRegistry.remove.call(accounts[9], {from: unauthorized}));
        });

        it("should let conduct restricted operations from authorized caller", async () => {
            assert.isTrue(await usersRegistry.setRolesLibrary.call(1, {from: owner}));
            assert.isTrue(await usersRegistry.setController.call(owner, {from: owner}));
            assert.isTrue(await usersRegistry.defineRole.call(101, {from: owner}));
            assert.isTrue(await usersRegistry.create.call(
                accounts[9],
                "Kot",
                "Koteikin",
                "Something",
                2,
                accounts[9],
                {from: owner}
            ));
            await usersRegistry.create(
                accounts[9],
                "Kot",
                "Koteikin",
                "Something",
                2,
                accounts[9],
                {from: owner}
            )
            assert.isTrue(await usersRegistry.update.call(
                accounts[9],
                "Kot",
                "Koteikin",
                "Something",
                4,
                accounts[9],
                {from: owner}
            ));
            assert.isTrue(await usersRegistry.remove.call(accounts[9], {from: owner}));
        });
    });

    describe("PropertyRegistry", () => {

        it("should not let conduct restricted operations from non-authorized caller", async () => {
            assert.isFalse(await propertyRegistry.setRolesLibrary.call(1, {from: unauthorized}));
            assert.isFalse(await propertyRegistry.setController.call(owner, {from: unauthorized}));

            assert.isFalse(await propertyRegistry.register.call(accounts[3], {from: unauthorized}));

            await propertyController.registerProperty(accounts[3], {from: owner});
            assert.isTrue(await propertyRegistry.relevant(accounts[3]));
            assert.isTrue(await propertyRegistry.includes(accounts[3]));
            assert.isFalse(await propertyRegistry.remove.call(accounts[3], false, {from: unauthorized}));

            await propertyController.removeProperty(accounts[3], {from: owner});
            assert.isFalse(await propertyRegistry.relevant(accounts[3]));
            assert.isFalse(await propertyRegistry.includes(accounts[3]));
        });

        it("should let conduct restricted operations from authorized caller", async () => {
            assert.isTrue(await propertyRegistry.setRolesLibrary.call(1, {from: owner}));
            assert.isTrue(await propertyRegistry.setController.call(owner, {from: owner}));

            await propertyRegistry.setController(owner, {from: owner});
            assert.isTrue(await propertyRegistry.register.call(accounts[3], {from: owner}));
            await propertyRegistry.register(accounts[3], {from: owner});
            assert.isTrue(await propertyRegistry.remove.call(accounts[3], false, {from: owner}));
        });

    });

    describe("DeedRegistry", () => {

        it("should not let conduct restricted operations from non-authorized caller", async () => {
            assert.isFalse(await deedRegistry.setRolesLibrary.call(1, {from: unauthorized}));
            assert.isFalse(await deedRegistry.setController.call(owner, {from: unauthorized}));

            assert.isFalse(await deedRegistry.register.call(accounts[3], {from: unauthorized}));

            await propertyController.registerDeed(accounts[3], {from: owner});
            assert.isTrue(await deedRegistry.registered(accounts[3]));
            assert.isTrue(await deedRegistry.includes(accounts[3]));
            assert.isFalse(await deedRegistry.remove.call(accounts[3], {from: unauthorized}));

            await propertyController.removeDeed(accounts[3], {from: owner});
            assert.isFalse(await deedRegistry.registered(accounts[3]));
            assert.isFalse(await deedRegistry.includes(accounts[3]));
        });

        it("should let conduct restricted operations from authorized caller", async () => {
            assert.isTrue(await deedRegistry.setRolesLibrary.call(1, {from: owner}));
            assert.isTrue(await deedRegistry.setController.call(owner, {from: owner}));

            await deedRegistry.setController(owner, {from: owner});
            assert.isTrue(await deedRegistry.register.call(accounts[3], {from: owner}));
            await deedRegistry.register(accounts[3], {from: owner});
            assert.isTrue(await deedRegistry.remove.call(accounts[3], {from: owner}));
        });

        it("should register deed", async () => {
            await deedRegistry.setController(owner);
            const tx = await deedRegistry.register(accounts[9]);
            console.log('Deed registration tx gas used: ' + tx.receipt.gasUsed);
        });
    });

    
    describe("PropertyProxy", () => {

        it("should not let conduct restricted operations from non-authorized caller", async () => {
            assert.isFalse(await propertyProxy.setRolesLibrary.call(1, {from: unauthorized}));
            assert.isFalse(await propertyProxy.setController.call(owner, {from: unauthorized}));
            assert.isFalse(await propertyProxy.forcePropertyChangeContractOwnership.call(
                Property.address, accounts[5], {from: unauthorized}
            ));
        });

        it("should not conduct restricted operations from authorized caller", async () => {
            assert.isTrue(await propertyProxy.setRolesLibrary.call(1, {from: owner}));
            assert.isTrue(await propertyProxy.setController.call(owner, {from: owner}));

            const oldProperty = await Property.deployed();
            await oldProperty.forceChangeContractOwnership(PropertyProxy.address);
            assert.isTrue(await propertyProxy.forcePropertyChangeContractOwnership.call(
                Property.address, accounts[5], {from: owner}
            ));
        });
    });


    describe("PropertyFactory", () => {

        it("should not let conduct restricted operations from non-authorized caller", async () => {
            assert.isFalse(await propertyFactory.setRolesLibrary.call(1, {from: unauthorized}));
            assert.isFalse(await propertyFactory.setController.call(owner, {from: unauthorized}));
            assert.isFalse(await propertyFactory.setProxy.call(propertyProxy.address, {from: unauthorized}));

            equal(await propertyFactory.createProperty.call(
                ZERO_ADDRESS, owner, "Property Name", "Property Address", 1, 100, {from: unauthorized}
            ), ZERO_ADDRESS);
        });

        it("should let conduct restricted operations from authorized caller", async () => {
            assert.isTrue(await propertyFactory.setRolesLibrary.call(1, {from: owner}));
            assert.isTrue(await propertyFactory.setController.call(owner, {from: owner}));
            assert.isTrue(await propertyFactory.setProxy.call(propertyProxy.address, {from: owner}));

            await propertyFactory.setController(owner, {from: owner});
            const simulatedAddress = await propertyFactory.createProperty.call(
                ZERO_ADDRESS, owner, "Property Name", "Property Address", 1, 100, {from: owner}
            );
            assert.notEqual(simulatedAddress, ZERO_ADDRESS);
        });
    });


    describe("MultiEventsHistory", () => {

        it("should not let conduct restricted operations from non-authorized caller", async () => {
            assert.isFalse(await multiEventsHistory.setRolesLibrary.call(1, {from: unauthorized}));
            assert.isFalse(await multiEventsHistory.authorize.call(unauthorized, {from: unauthorized}));
        });

        it("should let conduct restricted operations from authorized caller", async () => {
            assert.isTrue(await multiEventsHistory.setRolesLibrary.call(1, {from: owner}));
            assert.isTrue(await multiEventsHistory.authorize.call(unauthorized, {from: owner}));
        });
    });


    describe("PropertyController", () => {

        it("should not let conduct restricted operations from non-authorized caller", async () => {
            assert.isFalse(await propertyController.setRolesLibrary.call(1, {from: unauthorized}));
            assert.isFalse(await propertyController.setPropertyProxy.call(propertyProxy.address, {from: unauthorized}));
            assert.isFalse(await propertyController.setPropertyFactory.call(propertyFactory.address, {from: unauthorized}));
            assert.isFalse(await propertyController.setPropertyRegistry.call(propertyRegistry.address, {from: unauthorized}));
            assert.isFalse(await propertyController.setDeedRegistry.call(deedRegistry.address, {from: unauthorized}));
            assert.isFalse(await propertyController.setUsersRegistry.call(usersRegistry.address, {from: unauthorized}));
            assert.isFalse(await propertyController.setToken.call(tokenMock.address, {from: unauthorized}));
            assert.isFalse(await propertyController.setFeeCalc.call(feeCalc.address, {from: unauthorized}));
            assert.isFalse(await propertyController.setFeeWallets.call(owner, owner, {from: unauthorized}));

            assert.isFalse(await propertyController.createAndRegisterProperty.call(
                previousProperty,
                seller,
                propertyName,
                propertyAddress,
                propertyAreaType,
                propertyArea,
                {from: unauthorized}
            ));

            assert.isFalse(await propertyController.registerProperty.call(Property.address, {from: unauthorized}));
            assert.isFalse(await propertyController.removeProperty.call(Property.address, {from: unauthorized}));

            const tx = await propertyController.createAndRegisterProperty(
                previousProperty,
                seller,
                propertyName,
                propertyAddress,
                propertyAreaType,
                propertyArea
            );
            const txLogs = parseLogs(topics, tx.receipt.logs);

            const temporaryPropertyAddress = txLogs[0].args.propertyAddress;

            assert.isFalse(await propertyController.reserveDeed.call(
                BaseDeed.address,
                temporaryPropertyAddress,
                1,
                seller,
                buyer,
                EscrowEther.address,
                accounts.slice(2, 6),
                [1],
                {from: unauthorized}
             ));

            assert.isFalse(await propertyController.registerDeed.call(BaseDeed.address, {from: unauthorized}));
            await propertyController.registerDeed(BaseDeed.address, {from: owner});
            assert.isFalse(await propertyController.removeDeed.call(BaseDeed.address, {from: unauthorized}));
        });


        it("should not let conduct restricted operations from non-authorized caller", async () => {
            assert.isTrue(await propertyController.setRolesLibrary.call(1, {from: owner}));
            assert.isTrue(await propertyController.setPropertyProxy.call(propertyProxy.address, {from: owner}));
            assert.isTrue(await propertyController.setPropertyFactory.call(propertyFactory.address, {from: owner}));
            assert.isTrue(await propertyController.setPropertyRegistry.call(propertyRegistry.address, {from: owner}));
            assert.isTrue(await propertyController.setDeedRegistry.call(deedRegistry.address, {from: owner}));
            assert.isTrue(await propertyController.setUsersRegistry.call(usersRegistry.address, {from: owner}));
            assert.isTrue(await propertyController.setToken.call(tokenMock.address, {from: owner}));
            assert.isTrue(await propertyController.setFeeCalc.call(feeCalc.address, {from: owner}));
            assert.isTrue(await propertyController.setFeeWallets.call(owner, owner, {from: owner}));


            assert.isTrue(await propertyController.createAndRegisterProperty.call(
                previousProperty,
                seller,
                propertyName,
                propertyAddress,
                propertyAreaType,
                propertyArea,
                {from: owner}
            ));


            assert.isTrue(await propertyController.registerProperty.call(1, {from: owner}));

            await propertyController.registerProperty(1, {from: owner});
            assert.isTrue(await propertyController.removeProperty.call(1, {from: owner}));

            const tx = await propertyController.createAndRegisterProperty(
                previousProperty,
                seller,
                propertyName,
                propertyAddress,
                propertyAreaType,
                propertyArea
            );
            const txLogs = parseLogs(topics, tx.receipt.logs);

            const temporaryPropertyAddress = txLogs[0].args.propertyAddress;

            assert.isTrue(await propertyController.reserveDeed.call(
                BaseDeed.address,
                temporaryPropertyAddress,
                1,
                seller,
                buyer,
                EscrowEther.address,
                accounts.slice(2, 6),
                [1],
                {from: owner}
             ));

            assert.isTrue(await propertyController.registerDeed.call(BaseDeed.address, {from: owner}));
            await propertyController.registerDeed(BaseDeed.address, {from: owner});
            assert.isTrue(await propertyController.removeDeed.call(BaseDeed.address, {from: owner}));
        });


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
                    args: {self: propertyFactory.address}
                },
                {
                    address: multiEventsHistory.address,
                    event: "PropertyRegistered",
                    args: {self: propertyRegistry.address}
                }
            ]);

            property = Property.at(txLogs[0].args.propertyAddress);
            await reverter.snapshot();
        });

    });


    describe("Deeds", () => {

        it("should test MetaDeedCalifornia with EscrowEther", async () => {
            const metaDeed = metaDeedCalifornia;
            const escrowType = "Ether";
            const escrowDepositFunction = "send";

            const intermediaries = [accounts[3], accounts[4], accounts[5], accounts[6]];
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

            const intermediaries = [accounts[3], accounts[4], accounts[5], accounts[6]];
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
