"use strict";

const BaseDeed = artifacts.require('./BaseDeed.sol');
const DeedRegistry = artifacts.require('./DeedRegistry.sol');
const TokenMock = artifacts.require('./TokenMock.sol');
const FeeCalc = artifacts.require('./FeeCalc.sol');
const Mock = artifacts.require('./Mock.sol');
const Property = artifacts.require("./Property.sol");
const PropertyController = artifacts.require("./PropertyController.sol");
const PropertyFactory = artifacts.require("./PropertyFactory.sol");
const PropertyFactoryInterface = artifacts.require("./PropertyFactoryInterface.sol");
const PropertyRegistry = artifacts.require('./PropertyRegistry.sol');
const PropertyRegistryInterface = artifacts.require('./PropertyRegistryInterface.sol');
const PropertyProxy = artifacts.require('./PropertyProxy.sol');
const UsersRegistry = artifacts.require('./UsersRegistry.sol');
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol');
const RolesLibrary = artifacts.require('./RolesLibrary.sol');

const Reverter = require('./helpers/reverter');
const { AssertExpectations, IgnoreAuth, ExpectAuth } = require('./helpers/mock');


const { assertLogs, equal } = require("./helpers/assert");
const { ZERO_ADDRESS } = require("./helpers/constants");
const { bytes32 } = require('./helpers/helpers');


contract('PropertyController', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    let assertExpectations;
    let ignoreAuth;
    let expectAuth;

    const baseDeedInterface = web3.eth.contract(BaseDeed.abi).at('0x0');
    const propertyFactoryInterface = web3.eth.contract(PropertyFactoryInterface.abi).at('0x0');
    const propertyRegistryInterface = web3.eth.contract(PropertyRegistryInterface.abi).at('0x0');
    const propertyInterface = web3.eth.contract(Property.abi).at('0x0');
    const deedRegistryInterface = web3.eth.contract(DeedRegistry.abi).at('0x0');
    const propertyProxyInterface = web3.eth.contract(PropertyProxy.abi).at('0x0');

    const owner = accounts[0];
    const unauthorized = accounts[2];

    let mock;
    let property;
    let propertyController;
    let multiEventsHistory;

    const newServiceAddress = accounts[9];
    const services = [
        {
            nameLower: "propertyProxy",
            nameUpper: "PropertyProxy",
            oldAddress: Mock.address,
            newAddress: newServiceAddress
        },
        {
            nameLower: "propertyFactory",
            nameUpper: "PropertyFactory",
            oldAddress: Mock.address,
            newAddress: newServiceAddress
        },
        {
            nameLower: "propertyRegistry",
            nameUpper: "PropertyRegistry",
            oldAddress: Mock.address,
            newAddress: newServiceAddress
        },
        {
            nameLower: "deedRegistry",
            nameUpper: "DeedRegistry",
            oldAddress: Mock.address,
            newAddress: newServiceAddress
        },
        {
            nameLower: "usersRegistry",
            nameUpper: "UsersRegistry",
            oldAddress: Mock.address,
            newAddress: newServiceAddress
        },
        {
            nameLower: "token",
            nameUpper: "Token",
            oldAddress: TokenMock.address,
            newAddress: newServiceAddress
        },
        {
            nameLower: "feeCalc",
            nameUpper: "FeeCalc",
            oldAddress: Mock.address,
            newAddress: newServiceAddress
        },
    ];

    const assertSetService = async (contract, services, from, success) => {
        for (let service of services) {
            if (!success) {
                await expectAuth(propertyController, from, 'set' + services.nameUpper);
            }

            let result;
            result = await contract[service.nameLower]();
            equal(result, service.oldAddress);
            const tx = await contract['set' + service.nameUpper](
                service.newAddress, {from: from}
            );
            result = await contract[service.nameLower]();
            equal(result, success ? service.newAddress : service.oldAddress);

            let events = [];
            if (success) {
                events.push({
                    address: MultiEventsHistory.address,
                    event: "ServiceChanged",
                    args: {
                        self: propertyController.address,
                        name: service.nameUpper,
                        oldAddress: service.oldAddress,
                        newAddress: service.newAddress
                    }
                });
            }
            else {
                await assertExpectations();
            }

            assertLogs(tx.logs, events);
        }
    }

    before('setup', async () => {
        mock = await Mock.deployed();
        property = await Property.deployed();
        propertyController = await PropertyController.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();

        assertExpectations = AssertExpectations(mock);
        ignoreAuth = IgnoreAuth(mock);
        expectAuth = ExpectAuth(mock);

        await ignoreAuth(true);

        await propertyController.setupEventsHistory(MultiEventsHistory.address);
        await multiEventsHistory.authorize(propertyController.address);

        await reverter.snapshot();
    });

    describe("Services", () => {

        it("should set correct service addresses on deployment", async () => {

            // Wait until everything is deployed
            await PropertyProxy.deployed();
            await PropertyFactory.deployed();
            await PropertyRegistry.deployed();
            await DeedRegistry.deployed();
            await UsersRegistry.deployed();
            await TokenMock.deployed();
            await FeeCalc.deployed();

            // Create new PropertyController instance with the given addresses
            const controller = await PropertyController.new(
                Mock.address, PropertyProxy.address, PropertyFactory.address, PropertyRegistry.address,
                DeedRegistry.address, UsersRegistry.address, TokenMock.address, FeeCalc.address
            );

            // Check all of the ecosystem attributes
            let result;
            result = await controller.propertyProxy.call();
            equal(result, PropertyProxy.address);
            result = await controller.propertyFactory.call();
            equal(result, PropertyFactory.address);
            result = await controller.propertyRegistry.call();
            equal(result, PropertyRegistry.address);
            result = await controller.deedRegistry.call();
            equal(result, DeedRegistry.address);
            result = await controller.usersRegistry.call();
            equal(result, UsersRegistry.address);
            result = await controller.token.call();
            equal(result, TokenMock.address);
            result = await controller.feeCalc.call();
            equal(result, FeeCalc.address);
        });

        it("should return `true` when setting the services by the authorized caller", async () => {
            for (let service of services) {
                const result = await propertyController['set' + service.nameUpper].call(newServiceAddress);
                assert.isTrue(result);
            }
        });

        it("should be able to change the services by the authorized caller", async () => {
            const success = true;
            await assertSetService(propertyController, services, owner, success);
        });

        it("should check auth when setting the services by the non-authorized caller", async () => {
            await ignoreAuth(false);

            for (let service of services) {
                await expectAuth(propertyController, unauthorized, "set" + service.nameUpper);
                const result = await propertyController['set' + service.nameUpper](
                    newServiceAddress, {from: unauthorized}
                );
                assert.equal(result.logs.length, 0);

                let currentService = await propertyController[service.nameLower].call();
                assert.equal(currentService, service.oldAddress);
            }
            await assertExpectations();
        });

        it("should NOT be able to change services with null address", async () => {
            for (let service of services) {
                const result = await propertyController['set' + service.nameUpper].call(ZERO_ADDRESS);
                assert.isFalse(result);
            }
        });

        it('should emit ServiceChanged when setting services', async () => {
            for (let service of services) {
                const result = await propertyController['set' + service.nameUpper](newServiceAddress);

                assertLogs(result.logs, [{
                    address: MultiEventsHistory.address,
                    event: 'ServiceChanged',
                    args: {
                        self: propertyController.address,
                        name: service.nameUpper,
                        newAddress: newServiceAddress
                    }
                }]);
            }
        });
    });

    describe("Create and register property", () => {
        
        it('should return `true` when create and register property', async () => {
            await mock.expect(
                propertyController.address,
                0,
                propertyFactoryInterface.createProperty.getData(
                    ZERO_ADDRESS, owner, "", "", 1, 1
                ),
                bytes32(property.address)
            );

            await mock.expect(
                propertyController.address,
                0,
                propertyRegistryInterface.register.getData(property.address),
                1
            );

            assert.isTrue(await propertyController.createAndRegisterProperty.call(
                ZERO_ADDRESS, owner, "", "", 1, 1
            ));
        });

        it('should return `true` when register property', async () => {
            let property = '0xffffff0fffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyController.registerProperty.call(
                property
            ));
        });

        it("should check auth when creating and registering property", async () => {
            await ignoreAuth(false);

            const result = await propertyController.createAndRegisterProperty.call(
                ZERO_ADDRESS, owner, "", "", 1, 1
            );
            assert.isFalse(result);

            await expectAuth(propertyController, unauthorized, "createAndRegisterProperty");

            await propertyController.createAndRegisterProperty(
                ZERO_ADDRESS, owner, "", "", 1, 1, {from: unauthorized}
            );

            await assertExpectations();
        });

        it("should create and register new property from an authorized caller", async () => {

            await mock.expect(
                propertyController.address,
                0,
                propertyFactoryInterface.createProperty.getData(
                    ZERO_ADDRESS, owner, "", "", 1, 1
                ),
                bytes32(property.address)
            );

            await mock.expect(
                propertyController.address,
                0,
                propertyRegistryInterface.register.getData(property.address),
                1
            );

            const result = await propertyController.createAndRegisterProperty.call(
                ZERO_ADDRESS, owner, "", "", 1, 1
            );
            assert.isTrue(result);

            await propertyController.createAndRegisterProperty(
                ZERO_ADDRESS, owner, "", "", 1, 1
            );

            await assertExpectations();
        });

        it("should check auth when registering property", async () => {
            await ignoreAuth(false);

            await expectAuth(propertyController, unauthorized, "registerProperty");

            const result = await propertyController.registerProperty(
                property.address, {from: unauthorized}
            );

            await assertExpectations();
        });

        it("should register new property from an authorized caller", async () => {
            await mock.expect(
                propertyController.address,
                0,
                propertyRegistryInterface.register.getData(
                    property.address
                ),
                1
            );

            const result = await propertyController.registerProperty.call(
                property.address
            );
            assert.isTrue(result);

            await propertyController.registerProperty(
                property.address
            );

            await assertExpectations();
        });

        it('should allow to migrate property');
    });

    describe("Remove property", () => {

        it('should return `true` when remove property', async () => {
            let property = '0xffffffffffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyController.removeProperty.call(
                property
            ));
        });
        
        it('should allow to remove property', async () => {
            await mock.expect(
                propertyController.address,
                0,
                propertyRegistryInterface.remove.getData(property.address, false),
                1
            );
    
            await propertyController.removeProperty(property.address);
            await assertExpectations();
        });

        it("should check auth when removing property", async () => {
            let property = '0xffffffffffffffffffffffffffffffffffffffff';

            await ignoreAuth(false);

            await expectAuth(propertyController, unauthorized, "removeProperty");

            await propertyController.removeProperty(property, {from: unauthorized});

            await assertExpectations();
        });

    });

    describe("Reserve Deed", () => {

        it('should not allow to reserve Null deed', async () => {
            const property = '0xffffffffffffffffffffffffffffffffffffffff';
            const price = 1000;
            const intermediaries = [accounts[4], accounts[5]];
            const payments = [price];
            
            assert.isFalse(await propertyController.reserveDeed.call(
                0,
                property,
                price,
                accounts[1],
                accounts[2],
                accounts[3],
                intermediaries,
                payments,
                {from: owner}
            ));
        });

        it('should allow to reserve deed', async () => {
            const property = Mock.address;
            const price = 1000;
            const intermediaries = [accounts[4], accounts[5]];
            const payments = [price];
            const seller = accounts[1];
    
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.metaDeed.getData(),
                bytes32(Mock.address)
            );
            
            await mock.expect(
                PropertyController.address,
                0,
                propertyRegistryInterface.relevant.getData(property),
                1
            );
            
            await mock.expect(
                PropertyController.address,
                0,
                propertyInterface.status.getData(),
                0
            );
            
            await mock.expect(
                PropertyController.address,
                0,
                propertyInterface.getTitleOwner.getData(),
                bytes32(seller)
            );

            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.reserve.getData(
                    Mock.address,
                    price,
                    seller,
                    accounts[2],
                    accounts[3],
                    intermediaries,
                    payments
                ),
                1
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                propertyProxyInterface.setPropertyToPendingState.getData(
                    property, Mock.address
                ),
                1
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                deedRegistryInterface.register.getData(Mock.address),
                1
            );
            
            let result = await propertyController.reserveDeed.call(
                Mock.address,
                Mock.address,
                price,
                seller,
                accounts[2],
                accounts[3],
                intermediaries,
                payments,
                {from: owner}
            );
            
            assert.isTrue(result);
    
            let result2 = await propertyController.reserveDeed(
                Mock.address,
                Mock.address,
                price,
                seller,
                accounts[2],
                accounts[3],
                intermediaries,
                payments,
                {from: owner}
            );
    
            assertLogs(result2.logs, [{
                address: MultiEventsHistory.address,
                event: 'DeedReserved',
                args: {
                    self: propertyController.address,
                    deed: Mock.address,
                    property: property,
                    seller: accounts[1],
                    buyer: accounts[2],
                    escrow: accounts[3]
                }
            }]);
    
            await assertExpectations();
        });

        it("should check auth when reserving deed", async () => {
            const property = Mock.address;
            const price = 1000;
            const intermediaries = [accounts[4], accounts[5]];
            const payments = [price];
            const seller = accounts[1];

            await ignoreAuth(false);

            await expectAuth(propertyController, unauthorized, "reserveDeed");

            let result = await propertyController.reserveDeed(
                Mock.address,
                property,
                price,
                seller,
                accounts[2],
                accounts[3],
                intermediaries,
                payments,
                {from: unauthorized}
            );

            assert.equal(result.logs.length, 0);

            await assertExpectations();
        });
    });
    
    describe("Register Deed", () => {

        it('should not allow to register Null deed', async () => {
            assert.isFalse(await propertyController.registerDeed.call(0));
        });

        it('should return `true` when register deed', async () => {
            let deed = '0xffffffffffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyController.registerDeed.call(deed));
        });

        it('should allow to register deed', async () => {
            await mock.expect(
                PropertyController.address,
                0,
                deedRegistryInterface.register.getData(Mock.address),
                1
            );
            
            await propertyController.registerDeed(Mock.address);
            await assertExpectations();
        });

        it("should check auth when registering deed", async () => {
            let deed = '0xffffff0fffffffffffffffffffffffffffffffff';

            await ignoreAuth(false);

            await expectAuth(propertyController, unauthorized, "registerDeed");

            await propertyController.registerDeed(deed, {from: unauthorized});

            await assertExpectations();
        });

    });

    describe("Remove Deed", () => {

        it('should return `true` when remove deed', async () => {
            let deed = '0xffffffffffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyController.removeDeed.call(deed));
        });

        it('should allow to remove deed', async () => {
            await mock.expect(
                PropertyController.address,
                0,
                deedRegistryInterface.remove.getData(Mock.address),
                1
            );
    
            await propertyController.removeDeed(Mock.address);
            await assertExpectations();
        });

        it("should check auth when removing deed", async () => {
            let deed = '0xffffffffffffffffffffffffffffffffffffffff';

            await ignoreAuth(false);

            await expectAuth(propertyController, unauthorized, "removeDeed");

            await propertyController.removeDeed(deed, {from: unauthorized});

            await assertExpectations();
        });
    });

    describe("Change Deed Intermediary", () => {

        it('should not allow to change Null deed', async () => {
            assert.isFalse(await propertyController.changeDeedIntermediary.call(
                0, 1, accounts[4]
            ));
        });
        
        it('should not allow to change deed with a Null newActor', async () => {
            assert.isFalse(await propertyController.changeDeedIntermediary.call(
                Mock.address, 1, 0
            ));
        });
        
        it('should allow to change deed', async () => {
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.changeIntermediary.getData(1, accounts[4]),
                bytes32(Mock.address)
            );
            
            assert.isTrue(await propertyController.changeDeedIntermediary.call(Mock.address, 1, accounts[4]));
            
            await propertyController.changeDeedIntermediary(Mock.address, 1, accounts[4]);
            await assertExpectations();
        });

        it("should check auth when removing deed", async () => {
            await ignoreAuth(false);

            await expectAuth(propertyController, unauthorized, "changeDeedIntermediary");

            await propertyController.changeDeedIntermediary(
                Mock.address, 1, accounts[4], {from: unauthorized}
            );

            await assertExpectations();
        });
    });
});
