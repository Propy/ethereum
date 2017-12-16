pragma solidity 0.4.18;

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

    function StorageTester(Storage _store, bytes32 _crate) StorageAdapter(_store, _crate) {
        reinit();
    }

    function reinit() {
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

    function setUInt(uint _value) {
        store.set(uintVar, _value);
    }

    function getUInt() constant returns(uint) {
        return store.get(uintVar);
    }

    function setInt(int _value) {
        store.set(intVar, _value);
    }

    function getInt() constant returns(int) {
        return store.get(intVar);
    }

    function setAddress(address _value) {
        store.set(addressVar, _value);
    }

    function getAddress() constant returns(address) {
        return store.get(addressVar);
    }

    function setBool(bool _value) {
        store.set(boolVar, _value);
    }

    function getBool() constant returns(bool) {
        return store.get(boolVar);
    }

    function setBytes32(bytes32 _value) {
        store.set(bytes32Var, _value);
    }

    function getBytes32() constant returns(bytes32) {
        return store.get(bytes32Var);
    }

    function setMapping(bytes32 _key, bytes32 _value) {
        store.set(mappingVar, _key, _value);
    }

    function getMapping(bytes32 _key) constant returns(bytes32) {
        return store.get(mappingVar, _key);
    }

    function setAddressUIntMapping(address _key, uint _value) {
        store.set(addressUIntMappingVar, _key, _value);
    }

    function getAddressUIntMapping(address _key) constant returns(uint) {
        return store.get(addressUIntMappingVar, _key);
    }

    function addSet(bytes32 _value) {
        store.add(setVar, _value);
    }

    function removeSet(bytes32 _value) {
        store.remove(setVar, _value);
    }

    function includesSet(bytes32 _value) constant returns(bool) {
        return store.includes(setVar, _value);
    }

    function countSet() constant returns(uint) {
        return store.count(setVar);
    }

    function getSet() constant returns(bytes32[]) {
        return store.get(setVar);
    }

    function addAddressesSet(address _value) {
        store.add(addressesSetVar, _value);
    }

    function removeAddressesSet(address _value) {
        store.remove(addressesSetVar, _value);
    }

    function includesAddressesSet(address _value) constant returns(bool) {
        return store.includes(addressesSetVar, _value);
    }

    function countAddressesSet() constant returns(uint) {
        return store.count(addressesSetVar);
    }

    function getAddressesSet() constant returns(address[]) {
        return store.get(addressesSetVar);
    }
}
