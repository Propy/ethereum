pragma solidity 0.4.24;

import '../adapters/StorageAdapter.sol';


contract StorageTester is StorageAdapter {
    StorageInterface.UInt uintVar;
    StorageInterface.Int intVar;
    StorageInterface.Address addressVar;
    StorageInterface.Bool boolVar;
    StorageInterface.Bytes32 bytes32Var;
    StorageInterface.Mapping mappingVar;
    StorageInterface.AddressUIntMapping addressUIntMappingVar;
    StorageInterface.Set setVar;
    StorageInterface.AddressesSet addressesSetVar;

    // FIXME: Test all existing data types

    constructor(Storage _store, bytes32 _crate) StorageAdapter(_store, _crate) public {
        reinit();
    }

    function reinit() public {
        uintVar.init('uintVar');
        intVar.init('intVar');
        addressVar.init('addressVar');
        boolVar.init('boolVar');
        bytes32Var.init('bytes32Var');
        mappingVar.init('mappingVar');
        addressUIntMappingVar.init('addressUIntMappingVar');
        setVar.init('setVar');
        addressesSetVar.init('addressesSetVar');
    }

    function setUInt(uint _value) public {
        store.set(uintVar, _value);
    }

    function getUInt() constant public returns(uint) {
        return store.get(uintVar);
    }

    function setInt(int _value) public {
        store.set(intVar, _value);
    }

    function getInt() constant public returns(int) {
        return store.get(intVar);
    }

    function setAddress(address _value) public {
        store.set(addressVar, _value);
    }

    function getAddress() constant public returns(address) {
        return store.get(addressVar);
    }

    function setBool(bool _value) public {
        store.set(boolVar, _value);
    }

    function getBool() constant public returns(bool) {
        return store.get(boolVar);
    }

    function setBytes32(bytes32 _value) public {
        store.set(bytes32Var, _value);
    }

    function getBytes32() constant public returns(bytes32) {
        return store.get(bytes32Var);
    }

    function setMapping(bytes32 _key, bytes32 _value) public {
        store.set(mappingVar, _key, _value);
    }

    function getMapping(bytes32 _key) constant public returns(bytes32) {
        return store.get(mappingVar, _key);
    }

    function setAddressUIntMapping(address _key, uint _value) public {
        store.set(addressUIntMappingVar, _key, _value);
    }

    function getAddressUIntMapping(address _key) constant public returns(uint) {
        return store.get(addressUIntMappingVar, _key);
    }

    function addSet(bytes32 _value) public {
        store.add(setVar, _value);
    }

    function removeSet(bytes32 _value) public {
        store.remove(setVar, _value);
    }

    function includesSet(bytes32 _value) constant public returns(bool) {
        return store.includes(setVar, _value);
    }

    function countSet() constant public returns(uint) {
        return store.count(setVar);
    }

    function getSet() constant public returns(bytes32[]) {
        return store.get(setVar);
    }

    function addAddressesSet(address _value) public {
        store.add(addressesSetVar, _value);
    }

    function removeAddressesSet(address _value) public {
        store.remove(addressesSetVar, _value);
    }

    function includesAddressesSet(address _value) constant public returns(bool) {
        return store.includes(addressesSetVar, _value);
    }

    function countAddressesSet() constant public returns(uint) {
        return store.count(addressesSetVar);
    }

    function getAddressesSet() constant public returns(address[]) {
        return store.get(addressesSetVar);
    }
}
