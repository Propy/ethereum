"use strict";

const BaseDeed = artifacts.require('./BaseDeed.sol');
const DeedRegistry = artifacts.require('./DeedRegistry.sol');
const FakeCoin = artifacts.require('./FakeCoin.sol');
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

const Asserts = require('./helpers/asserts');
const Reverter = require('./helpers/reverter');

const { ZERO_ADDRESS, assertExpectations, assertLogs, equal, bytes32 } = require('./helpers/helpers');


contract('PropertyController', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const asserts = Asserts(assert);

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
            oldAddress: FakeCoin.address,
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

            assertLogs(tx.logs, events);
        }
    }

    before('setup', async () => {
        mock = await Mock.deployed();
        property = await Property.deployed();
        propertyController = await PropertyController.deployed();
        multiEventsHistory = await MultiEventsHistory.deployed();

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
            await FakeCoin.deployed();
            await FeeCalc.deployed();

            // Create new PropertyController instance with the given addresses
            const controller = await PropertyController.new(
                PropertyProxy.address, PropertyFactory.address, PropertyRegistry.address,
                DeedRegistry.address, UsersRegistry.address, FakeCoin.address, FeeCalc.address
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
            equal(result, FakeCoin.address);
            result = await controller.feeCalc.call();
            equal(result, FeeCalc.address);
        });

        it("should return `true` when setting the services by the authorized caller", async () => {
            for (let service of services) {
                const result = await propertyController['set' + service.nameUpper].call(newServiceAddress, {from: owner});
                assert.isTrue(result);
            }
        });

        it("should be able to change the services by the authorized caller", async () => {
            const success = true;
            await assertSetService(propertyController, services, owner, success);
        });

        it("should return `false` when setting the services by the non-authorized caller", async () => {
            for (let service of services) {
                const result = await propertyController['set' + service.nameUpper].call(newServiceAddress, {from: unauthorized});
                assert.isFalse(result);
            }
        });

        it("should NOT be able to change the services by the non-authorized caller", async () => {
            const success = false;
            await assertSetService(propertyController, services, unauthorized, success);
        });

        it("should NOT be able to change services with null address", async () => {
            for (let service of services) {
                const result = await propertyController['set' + service.nameUpper].call(ZERO_ADDRESS, {from: owner});
                assert.isFalse(result);
            }
        });

        it('should emit ServiceChanged when setting from owner', async () => {
            for (let service of services) {
                const result = await propertyController['set' + service.nameUpper](newServiceAddress, {from: owner});

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

        it('should NOT emit event when setting the services by the non-authorized caller', async () => {
            for (let service of services) {
                const result = await propertyController['set' + service.nameUpper](newServiceAddress, {from: unauthorized});
                assert.equal(result.logs.length, 0);
            }
        });
    });

    describe("Create and register property", () => {
        
        it('should return `true` when create and register property from owner', async () => {
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
                ZERO_ADDRESS, owner, "", "", 1, 1, {from: owner}
            ));
        });

        it('should return `false` when crate and register property from non-authorized caller', async () => {
            assert.isFalse(await propertyController.createAndRegisterProperty.call(
                ZERO_ADDRESS, owner, "", "", 1, 1, {from: unauthorized}
            ));
        });

        it('should return `true` when register property from owner', async () => {
            let property = '0xffffff0fffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyController.registerProperty.call(
                property, {from: owner}
            ));
        });

        it('should return `false` when register property from non-authorized caller', async () => {
            let property = '0xffffff0fffffffffffffffffffffffffffffffff';
            assert.isFalse(await propertyController.registerProperty.call(
                property, {from: unauthorized}
            ));
        });

        it("should NOT create and register new property from non-authorized caller", async () => {

            const result = await propertyController.createAndRegisterProperty.call(
                ZERO_ADDRESS, owner, "", "", 1, 1, {from: unauthorized}
            );
            assert.isFalse(result);

            await propertyController.createAndRegisterProperty(
                ZERO_ADDRESS, owner, "", "", 1, 1, {from: unauthorized}
            );

            await assertExpectations(mock);
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
                ZERO_ADDRESS, owner, "", "", 1, 1, {from: owner}
            );
            assert.isTrue(result);

            await propertyController.createAndRegisterProperty(
                ZERO_ADDRESS, owner, "", "", 1, 1, {from: owner}
            );

            await assertExpectations(mock);
        });

        it("should NOT register new property from non-authorized caller", async () => {
            const result = await propertyController.registerProperty.call(
                property.address, {from: unauthorized}
            );
            assert.isFalse(result);

            await propertyController.registerProperty(
                property.address, {from: unauthorized}
            );

            await assertExpectations(mock);
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
                property.address, {from: owner}
            );
            assert.isTrue(result);

            await propertyController.registerProperty(
                property.address, {from: owner}
            );

            await assertExpectations(mock);
        });

        it('should allow to migrate property');
    });

    describe("Remove property", () => {

        it('should return `true` when remove property from owner', async () => {
            let property = '0xffffffffffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyController.removeProperty.call(
                property, {from: owner}
            ));
        });

        it('should return `false` when remove property from non-authorized caller', async () => {
            let property = '0xffffffffffffffffffffffffffffffffffffffff';
            assert.isFalse(await propertyController.removeProperty.call(
                property, {from: unauthorized}
            ));
        });
        
        it('should allow to remove property from owner', async () => {
            await mock.expect(
                propertyController.address,
                0,
                propertyRegistryInterface.remove.getData(property.address, false),
                1
            );
    
            await propertyController.removeProperty(property.address, {from: owner});
            await assertExpectations(mock);
        });
        
        it('should NOT allow to remove property from non-authorized caller', async () => {
            await propertyController.removeProperty(property.address, {from: unauthorized});
            await assertExpectations(mock);
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

        it.skip('should return `true` when reserve deed from owner', async () => {
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
                baseDeedInterface.property.getData(),
                bytes32(Mock.address)
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                propertyRegistryInterface.relevant.getData(Mock.address),
                1
            );
            
            await mock.expect(
                PropertyController.address,
                0,
                propertyInterface.status.getData(),
                1
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
        });

        it('should return `false` when reserve deed from non-authorized caller', async () => {
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
                baseDeedInterface.property.getData(),
                bytes32(Mock.address)
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                propertyRegistryInterface.relevant.getData(Mock.address),
                1
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                propertyInterface.status.getData(),
                1
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
    
            let result = await propertyController.reserveDeed.call(
                Mock.address,
                Mock.address,
                price,
                seller,
                accounts[2],
                accounts[3],
                intermediaries,
                payments,
                {from: unauthorized}
            );
            
            assert.isFalse(result);
        });
        
        it.skip('should allow to reserve deed from owner', async () => {
            const property = '0xffffffffffffffffffffffffffffffffffffffff';
            const price = 1000;
            const intermediaries = [accounts[4], accounts[5]];
            const payments = [price];
    
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.reserve.getData(
                    property,
                    price,
                    accounts[1],
                    accounts[2],
                    accounts[3],
                    intermediaries,
                    payments
                ),
                1
            );
    
            await propertyController.reserveDeed(
                Mock.address,
                property,
                price,
                accounts[1],
                accounts[2],
                accounts[3],
                intermediaries,
                payments,
                {from: owner}
            );
    
            await assertExpectations(mock);
        });
        
        it('should NOT allow reserve deed from non-authorized caller', async () => {
            const property = '0xffffffffffffffffffffffffffffffffffffffff';
            const price = 1000;
            const intermediaries = [accounts[4], accounts[5]];
            const payments = [price];
    
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.reserve.getData(
                    property,
                    price,
                    accounts[1],
                    accounts[2],
                    accounts[3],
                    intermediaries,
                    payments
                ),
                1
            );
    
           await propertyController.reserveDeed(
               Mock.address,
               property,
               price,
               accounts[1],
               accounts[2],
               accounts[3],
               intermediaries,
               payments,
               {from: unauthorized}
           );
           
           await assertExpectations(mock, 1, 0);
        });
        
        it('should emit DeedReserved when reserve deed from owner', async () => {
            const property = '0xffffffffffffffffffffffffffffffffffffffff';
            const price = 1000;
            const intermediaries = [accounts[4], accounts[5]];
            const payments = [price];
    
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.reserve.getData(
                    property,
                    price,
                    accounts[1],
                    accounts[2],
                    accounts[3],
                    intermediaries,
                    payments
                ),
                1
            );
    
            let result = await propertyController.reserveDeed(
                Mock.address,
                property,
                price,
                accounts[1],
                accounts[2],
                accounts[3],
                intermediaries,
                payments,
                {from: owner}
            );
    
            assertLogs(result.logs, [{
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
        });
        
        it('should NOT emit event when reserve deed from non-authorized caller', async () => {
            const property = '0xffffffffffffffffffffffffffffffffffffffff';
            const price = 1000;
            const intermediaries = [accounts[4], accounts[5]];
            const payments = [price];
    
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.reserve.getData(
                    property,
                    price,
                    accounts[1],
                    accounts[2],
                    accounts[3],
                    intermediaries,
                    payments
                ),
                1
            );
    
            let result = await propertyController.reserveDeed(
                Mock.address,
                property,
                price,
                accounts[1],
                accounts[2],
                accounts[3],
                intermediaries,
                payments,
                {from: unauthorized}
            );
    
            assert.equal(result.logs.length, 0);
        });
    });

    describe("Approve Deed", () => {
        
        it.skip('should allow to approve deed from seller', async () => {
            const seller = accounts[1];
            const buyer = accounts[2];
            const escrow = accounts[3];
            
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.property.getData(),
                bytes32(Mock.address)
            );
            
            await mock.expect(
                PropertyController.address,
                0,
                propertyRegistryInterface.relevant.getData(Mock.address),
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
                baseDeedInterface.metaDeed.getData(),
                bytes32(Mock.address)
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
                baseDeedInterface.seller.getData(),
                bytes32(seller)
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.buyer.getData(),
                bytes32(buyer)
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.escrow.getData(),
                bytes32(escrow)
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.approve.getData(),
                1
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                deedRegistryInterface.register.getData(Mock.address),
                1
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                propertyProxyInterface.setPropertyToPendingState.getData(Mock.address, Mock.address),
                1
            );
    
            //should Not allow to approve Null deed
            assert.isFalse(await propertyController.approveDeed.call(0, {from: seller}));
            
            //should return `true` when approve deed from seller
            assert.isTrue(await propertyController.approveDeed.call(Mock.address, {from: seller}));
            
            //should emit DeedApproved when approve deed from seller
            let result = await propertyController.approveDeed(Mock.address, {from: seller});
    
            assertLogs(result.logs, [{
                address: MultiEventsHistory.address,
                event: 'DeedApproved',
                args: {
                    self: propertyController.address,
                    deed: Mock.address
                }
            }]);

            await assertExpectations(mock);
        });

        it.skip('should NOT allow approve deed from non-seller', async () => {
            const seller = accounts[1];
    
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.property.getData(),
                bytes32(Mock.address)
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                propertyRegistryInterface.relevant.getData(Mock.address),
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
                baseDeedInterface.metaDeed.getData(),
                bytes32(Mock.address)
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                propertyInterface.getTitleOwner.getData(),
                bytes32(unauthorized)
            );
    
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.seller.getData(),
                bytes32(seller)
            );
    
            //should return `false` when approve deed from non-seller
            assert.isFalse(await propertyController.approveDeed.call(Mock.address, {from: unauthorized}));
            
            //should NOT emit event when approve deed from non-seller
            let result = await propertyController.approveDeed(Mock.address, {from: unauthorized});
            assert.equal(result.logs.length, 0);
    
            await assertExpectations(mock);
        });
    });

    describe("Register Deed", () => {

        it('should not allow to register Null deed', async () => {
            assert.isFalse(await propertyController.registerDeed.call(0, {from: owner}));
        });

        it('should return `true` when register deed from owner', async () => {
            let deed = '0xffffffffffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyController.registerDeed.call(deed, {from: owner}));
        });

        it('should return `false` when register deed from non-authorized caller', async () => {
            let deed = '0xffffff0fffffffffffffffffffffffffffffffff';
            assert.isFalse(await propertyController.registerDeed.call(deed, {from: unauthorized}));
        });

        it('should allow to register deed from owner', async () => {
            await mock.expect(
                PropertyController.address,
                0,
                deedRegistryInterface.register.getData(Mock.address),
                1
            );
            
            await propertyController.registerDeed(Mock.address, {from: owner});
            await assertExpectations(mock);
        });
        
        it('should NOT allow register deed from non-authorized caller', async () => {
            await propertyController.registerDeed(Mock.address, {from: unauthorized});
            await assertExpectations(mock);
        });
    });

    describe("Remove Deed", () => {

        it('should return `true` when remove deed from owner', async () => {
            let deed = '0xffffffffffffffffffffffffffffffffffffffff';
            assert.isTrue(await propertyController.removeDeed.call(deed, {from: owner}));
        });

        it('should return `false` when remove deed from non-authorized caller', async () => {
            let deed = '0xffffffffffffffffffffffffffffffffffffffff';
            assert.isFalse(await propertyController.removeDeed.call(deed, {from: unauthorized}));
        });

        it('should allow to remove deed from owner', async () => {
            await mock.expect(
                PropertyController.address,
                0,
                deedRegistryInterface.remove.getData(Mock.address),
                1
            );
    
            await propertyController.removeDeed(Mock.address, {from: owner});
            await assertExpectations(mock);
        });
        
        it('should NOT allow remove deed from non-authorized caller', async () => {
            await propertyController.removeDeed(Mock.address, {from: unauthorized});
            await assertExpectations(mock);
        });
    });

    describe("Change Deed Intermediary", () => {

        it('should not allow to change Null deed', async () => {
            assert.isFalse(await propertyController.changeDeedIntermediary.call(
                0, 1, accounts[4], {from: owner}
            ));
        });
        
        it('should not allow to change deed with a Null newActor', async () => {
            assert.isFalse(await propertyController.changeDeedIntermediary.call(
                Mock.address, 1, 0, {from: owner}
            ));
        });
        
        it('should allow to change deed from owner', async () => {
            await mock.expect(
                PropertyController.address,
                0,
                baseDeedInterface.changeIntermediary.getData(1, accounts[4]),
                bytes32(Mock.address)
            );
            
            assert.isTrue(await propertyController.changeDeedIntermediary.call(Mock.address, 1, accounts[4], {from: owner}));
            
            await propertyController.changeDeedIntermediary(Mock.address, 1, accounts[4], {from: owner});
            await assertExpectations(mock);
        });
        
        it('should NOT allow change deed from non-authorized caller', async () => {
            assert.isFalse(await propertyController.changeDeedIntermediary.call(
                Mock.address, 1, accounts[4], {from: unauthorized}
            ));
    
            await propertyController.changeDeedIntermediary(Mock.address, 1, accounts[4], {from: unauthorized});
            await assertExpectations(mock);
    
        });
    });
});
