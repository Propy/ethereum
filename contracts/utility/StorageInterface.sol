pragma solidity 0.4.23;

import "./Storage.sol";

/*
contract StorageMethods {
    function setUInt(bytes32, bytes32, uint);
    function setUInt8(bytes32, bytes32, uint8);
    function setInt(bytes32, bytes32, int);
    function setAddress(bytes32, bytes32, address);
    function setBool(bytes32, bytes32, bool);
    function setBytes32(bytes32, bytes32, bytes32);

    function getUInt(bytes32, bytes32) returns(uint) ;
    function getUInt8(bytes32, bytes32) returns(uint8) ;
    function getInt(bytes32, bytes32) returns(int) ;
    function getAddress(bytes32, bytes32) returns(address) ;
    function getBool(bytes32, bytes32) returns(bool) ;
    function getBytes32(bytes32, bytes32) returns(bytes32) ;
}
*/

library StorageInterface {

    // DEFINE STORAGE LINK //

    struct Config {
        Storage store;
        bytes32 crate;
    }


    // DEFINE PRIMITIVES //

    struct UInt {
        bytes32 id;
    }

    struct UInt8 {
        bytes32 id;
    }

    struct Int {
        bytes32 id;
    }

    struct Address {
        bytes32 id;
    }

    struct Bool {
        bytes32 id;
    }

    struct Bytes32 {
        bytes32 id;
    }

    struct Mapping {
        bytes32 id;
    }


    // DEFINE MAPPINGS //

    struct AddressAddressMapping {
        Mapping innerMapping;
    }

    struct AddressBoolMapping {
        Mapping innerMapping;
    }

    struct UintAddressBoolMapping {
        Mapping innerMapping;
    }

    struct AddressBytes32Mapping {
        Mapping innerMapping;
    }

    struct AddressUInt8Mapping {
        bytes32 id;
    }

    struct AddressUIntMapping {
        Mapping innerMapping;
    }

    struct AddressUIntUInt8Mapping {
        Mapping innerMapping;
    }

    struct UIntUIntBoolMapping {
        Mapping innerMapping;
    }

    struct AddressBytes4BoolMapping {
        Mapping innerMapping;
    }

    struct AddressBytes4Bytes32Mapping {
        Mapping innerMapping;
    }

    struct AddressUIntUIntMapping {
        Mapping innerMapping;
    }

    struct AddressUIntUIntUIntMapping {
        Mapping innerMapping;
    }

    struct AddressAddressUIntMapping {
        Mapping innerMapping;
    }

    struct AddressAddressUInt8Mapping {
        Mapping innerMapping;
    }

    struct AddressBytes32Bytes32Mapping {
        Mapping innerMapping;
    }

    struct UIntAddressMapping {
        Mapping innerMapping;
    }

    struct UIntAddressAddressMapping {
        Mapping innerMapping;
    }

    struct UIntAddressUIntMapping {
        Mapping innerMapping;
    }

    struct UIntBoolMapping {
        Mapping innerMapping;
    }

    struct UIntUIntMapping {
        Mapping innerMapping;
    }

    struct UIntEnumMapping {
        Mapping innerMapping;
    }

    struct AddressUIntAddressUInt8Mapping {
        Mapping innerMapping;
    }

    struct AddressUIntUIntAddressUInt8Mapping {
        Mapping innerMapping;
    }

    struct AddressUIntUIntUIntAddressUInt8Mapping {
        Mapping innerMapping;
    }

    struct UIntBytes32Mapping {
        Mapping innerMapping;
    }

    struct UIntUIntBytes32Mapping {
        Mapping innerMapping;
    }

    struct UIntUIntUIntBytes32Mapping {
        Mapping innerMapping;
    }

    struct Bytes32UIntMapping {
        Mapping innerMapping;
    }

    struct Set {
        UInt count;
        Mapping indexes;
        Mapping values;
    }

    struct AddressesSet {
        Set innerSet;
    }

    // Can't use modifier due to a Solidity bug.
    function sanityCheck(bytes32 _currentId, bytes32 _newId) internal {
        if (_currentId != 0 || _newId == 0) {
            throw;
        }
    }

    /// INITIATION ///

    function init(Config storage self, Storage _store, bytes32 _crate) internal {
        self.store = _store;
        self.crate = _crate;
    }


    /// INIT PRIMITIVES ///

    function init(UInt storage self, bytes32 _id) internal {
        sanityCheck(self.id, _id);
        self.id = _id;
    }

    function init(UInt8 storage self, bytes32 _id) internal {
        sanityCheck(self.id, _id);
        self.id = _id;
    }

    function init(Int storage self, bytes32 _id) internal {
        sanityCheck(self.id, _id);
        self.id = _id;
    }

    function init(Address storage self, bytes32 _id) internal {
        sanityCheck(self.id, _id);
        self.id = _id;
    }

    function init(Bool storage self, bytes32 _id) internal {
        sanityCheck(self.id, _id);
        self.id = _id;
    }

    function init(Bytes32 storage self, bytes32 _id) internal {
        sanityCheck(self.id, _id);
        self.id = _id;
    }

    /// INIT LOW-LEVEL MAPPING ///

    function init(Mapping storage self, bytes32 _id) internal {
        sanityCheck(self.id, _id);
        self.id = _id;
    }


    /// INIT HIGH-LEVEL MAPPINGS ///

    function init(AddressAddressMapping storage self, bytes32 _id) internal {
        // TODO : TESTING
        init(self.innerMapping, _id);
    }

    function init(AddressBoolMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(UintAddressBoolMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressBytes32Mapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressUInt8Mapping storage self, bytes32 _id) internal {
        sanityCheck(self.id, _id);
        self.id = _id;
    }

    function init(AddressUIntMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressUIntUInt8Mapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(UIntUIntBoolMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressBytes4BoolMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressBytes4Bytes32Mapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressUIntUIntMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressUIntUIntUIntMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressAddressUIntMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressAddressUInt8Mapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressBytes32Bytes32Mapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(UIntBytes32Mapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(UIntAddressMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(UIntAddressAddressMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(UIntAddressUIntMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(UIntBoolMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(UIntUIntMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(UIntEnumMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressUIntAddressUInt8Mapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressUIntUIntAddressUInt8Mapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(AddressUIntUIntUIntAddressUInt8Mapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(UIntUIntBytes32Mapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(UIntUIntUIntBytes32Mapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    function init(Bytes32UIntMapping storage self, bytes32 _id) internal {
        init(self.innerMapping, _id);
    }

    /// INIT SETS ///

    function init(Set storage self, bytes32 _id) internal {
        init(self.count, keccak256(_id, 'count'));
        init(self.indexes, keccak256(_id, 'indexes'));
        init(self.values, keccak256(_id, 'values'));
    }

    function init(AddressesSet storage self, bytes32 _id) internal {
        init(self.innerSet, _id);
    }



    /// SET PRIMITIVES ///

    function set(Config storage self, UInt storage item, uint _value) internal {
        self.store.setUInt(self.crate, item.id, _value);
    }

    function set(Config storage self, UInt8 storage item, uint8 _value) internal {
        self.store.setUInt8(self.crate, item.id, _value);
    }

    function set(Config storage self, Int storage item, int _value) internal {
        self.store.setInt(self.crate, item.id, _value);
    }

    function set(Config storage self, Address storage item, address _value) internal {
        self.store.setAddress(self.crate, item.id, _value);
    }

    function set(Config storage self, Bool storage item, bool _value) internal {
        self.store.setBool(self.crate, item.id, _value);
    }

    function set(Config storage self, Bytes32 storage item, bytes32 _value) internal {
        self.store.setBytes32(self.crate, item.id, _value);
    }


    /// SET LOW-LEVEL MAPPINGS ///

    function set(Config storage self, Mapping storage item, bytes32 _key, bytes32 _value) internal {
        self.store.setBytes32(self.crate, keccak256(item.id, _key), _value);
    }

    function set(Config storage self, Mapping storage item, bytes32 _key, bytes32 _key2, bytes32 _value) internal {
        set(self, item, keccak256(_key, _key2), _value);
    }

    function set(Config storage self, Mapping storage item, bytes32 _key, bytes32 _key2, bytes32 _key3, bytes32 _value) internal {
        set(self, item, keccak256(_key, _key2, _key3), _value);
    }



    /// SET HIGH-LEVEL MAPPINGS ///

    function set(Config storage self, AddressAddressMapping storage item, address _key, address _value) internal {
        // TODO : TESTING
        set(self, item.innerMapping, bytes32(_key), bytes32(_value));
    }

    function set(Config storage self, AddressBoolMapping storage item, address _key, bool _value) internal {
        set(self, item.innerMapping, bytes32(_key), toBytes32(_value));
    }

    function set(Config storage self, UintAddressBoolMapping storage item, uint _key, address _key2, bool _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), toBytes32(_value));
    }

    function set(Config storage self, AddressBytes32Mapping storage item, address _key, bytes32 _value) internal {
        set(self, item.innerMapping, bytes32(_key), _value);
    }

    function set(Config storage self, AddressUIntMapping storage item, address _key, uint _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_value));
    }

    function set(Config storage self, AddressUIntUInt8Mapping storage item, address _key, uint _key2, uint8 _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), bytes32(_value));
    }

    function set(Config storage self, UIntUIntBoolMapping storage item, uint _key, uint _key2, bool _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), toBytes32(_value));
    }

    function set(Config storage self, AddressBytes4BoolMapping storage item, address _key, bytes4 _key2, bool _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), toBytes32(_value));
    }

    function set(Config storage self, AddressBytes4Bytes32Mapping storage item, address _key, bytes4 _key2, bytes32 _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), _value);
    }

    function set(Config storage self, AddressUIntUIntMapping storage item, address _key, uint _key2, uint _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), bytes32(_value));
    }

    function set(Config storage self, AddressUIntUIntUIntMapping storage item, address _key, uint _key2,  uint _key3, uint _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), bytes32(_key3), bytes32(_value));
    }

    function set(Config storage self, AddressAddressUIntMapping storage item, address _key, address _key2, uint _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), bytes32(_value));
    }

    function set(Config storage self, AddressAddressUInt8Mapping storage item, address _key, address _key2, uint8 _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), bytes32(_value));
    }

    function set(Config storage self, AddressBytes32Bytes32Mapping storage item, address _key, bytes32 _key2, bytes32 _value) internal {
        set(self, item.innerMapping, bytes32(_key), _key2, _value);
    }

    function set(Config storage self, UIntBytes32Mapping storage item, uint _key, bytes32 _value) internal {
        set(self, item.innerMapping, bytes32(_key), _value);
    }

    function set(Config storage self, UIntAddressMapping storage item, uint _key, address _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_value));
    }

    function set(Config storage self, UIntBoolMapping storage item, uint _key, bool _value) internal {
        set(self, item.innerMapping, bytes32(_key), toBytes32(_value));
    }

    function set(Config storage self, UIntAddressAddressMapping storage item, uint _key, address _key2, address _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), bytes32(_value));
    }

    function set(Config storage self, UIntAddressUIntMapping storage item, uint _key, address _key2, uint _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), bytes32(_value));
    }

    function set(Config storage self, UIntUIntMapping storage item, uint _key, uint _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_value));
    }

    function set(Config storage self, UIntEnumMapping storage item, uint _key, uint8 _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_value));
    }

    function set(Config storage self, AddressUIntAddressUInt8Mapping storage item, address _key, uint _key2, address _key3, uint8 _value) internal {
        set(self, item.innerMapping, keccak256(_key, _key2, _key3), bytes32(_value));
    }

    function set(Config storage self, AddressUIntUIntAddressUInt8Mapping storage item, address _key, uint _key2, uint _key3, address _key4, uint8 _value) internal {
        set(self, item.innerMapping, keccak256(_key, _key2, _key3, _key4), bytes32(_value));
    }

    function set(Config storage self, AddressUIntUIntUIntAddressUInt8Mapping storage item, address _key, uint _key2,  uint _key3, uint _key4, address _key5, uint8 _value) internal {
        set(self, item.innerMapping, keccak256(_key, _key2, _key3, _key4, _key5), bytes32(_value));
    }

    function set(Config storage self, UIntUIntBytes32Mapping storage item, uint _key, uint _key2, bytes32 _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), _value);
    }

    function set(Config storage self, UIntUIntUIntBytes32Mapping storage item, uint _key, uint _key2,  uint _key3, bytes32 _value) internal {
        set(self, item.innerMapping, bytes32(_key), bytes32(_key2), bytes32(_key3), _value);
    }

    function set(Config storage self, Bytes32UIntMapping storage item, bytes32 _key, uint _value) internal {
        set(self, item.innerMapping, _key, bytes32(_value));
    }


    /// OPERATIONS ON SETS ///

    function add(Config storage self, Set storage item, bytes32 _value) internal {
        if (includes(self, item, _value)) {
            return;
        }
        uint newCount = count(self, item) + 1;
        set(self, item.values, bytes32(newCount), _value);
        set(self, item.indexes, _value, bytes32(newCount));
        set(self, item.count, newCount);
    }

    function add(Config storage self, AddressesSet storage item, address _value) internal {
        add(self, item.innerSet, bytes32(_value));
    }

    function remove(Config storage self, Set storage item, bytes32 _value) internal {
        if (!includes(self, item, _value)) {
            return;
        }
        uint lastIndex = count(self, item);
        bytes32 lastValue = get(self, item.values, bytes32(lastIndex));
        uint index = uint(get(self, item.indexes, _value));
        if (index < lastIndex) {
            set(self, item.indexes, lastValue, bytes32(index));
            set(self, item.values, bytes32(index), lastValue);
        }
        set(self, item.indexes, _value, bytes32(0));
        set(self, item.values, bytes32(lastIndex), bytes32(0));
        set(self, item.count, lastIndex - 1);
    }

    function remove(Config storage self, AddressesSet storage item, address _value) internal {
        remove(self, item.innerSet, bytes32(_value));
    }


    /// GET PRIMITIVES ///

    function get(Config storage self, UInt storage item) internal constant returns(uint) {
        return self.store.getUInt(self.crate, item.id);
    }

    function get(Config storage self, UInt8 storage item) internal constant returns(uint8) {
        return self.store.getUInt8(self.crate, item.id);
    }

    function get(Config storage self, Int storage item) internal constant returns(int) {
        return self.store.getInt(self.crate, item.id);
    }

    function get(Config storage self, Address storage item) internal constant returns(address) {
        return self.store.getAddress(self.crate, item.id);
    }

    function get(Config storage self, Bool storage item) internal constant returns(bool) {
        return self.store.getBool(self.crate, item.id);
    }

    function get(Config storage self, Bytes32 storage item) internal constant returns(bytes32) {
        return self.store.getBytes32(self.crate, item.id);
    }


    /// GET LOW-LEVEL MAPPINGS ///

    function get(Config storage self, Mapping storage item, bytes32 _key) internal constant returns(bytes32) {
        return self.store.getBytes32(self.crate, keccak256(item.id, _key));
    }

    function get(Config storage self, Mapping storage item, bytes32 _key, bytes32 _key2) internal constant returns(bytes32) {
        return get(self, item, keccak256(_key, _key2));
    }

    function get(Config storage self, Mapping storage item, bytes32 _key, bytes32 _key2, bytes32 _key3) internal constant returns(bytes32) {
        return get(self, item, keccak256(_key, _key2, _key3));
    }


    /// GET HIGH-LEVEL MAPPINGS ///

    function get(Config storage self, AddressAddressMapping storage item, address _key) internal constant returns(address) {
        // TODO : TESTING
        return address(get(self, item.innerMapping, bytes32(_key)));
    }

    function get(Config storage self, AddressBoolMapping storage item, address _key) internal constant returns(bool) {
        return toBool(get(self, item.innerMapping, bytes32(_key)));
    }

    function get(Config storage self, UintAddressBoolMapping storage item, uint _key, address _key2) internal constant returns(bool) {
        return toBool(get(self, item.innerMapping, bytes32(_key), bytes32(_key2)));
    }

    function get(Config storage self, AddressBytes32Mapping storage item, address _key) internal constant returns(bytes32) {
        return get(self, item.innerMapping, bytes32(_key));
    }

    function get(Config storage self, AddressUIntMapping storage item, address _key) internal constant returns(uint) {
        return uint(get(self, item.innerMapping, bytes32(_key)));
    }

    function get(Config storage self, AddressUIntUInt8Mapping storage item, address _key, uint _key2) internal constant returns(uint) {
        return uint8(get(self, item.innerMapping, bytes32(_key), bytes32(_key2)));
    }

    function get(Config storage self, UIntUIntBoolMapping storage item, uint _key, uint _key2) internal constant returns(bool) {
        return toBool(get(self, item.innerMapping, bytes32(_key), bytes32(_key2)));
    }

    function get(Config storage self, AddressBytes4BoolMapping storage item, address _key, bytes4 _key2) internal constant returns(bool) {
        return toBool(get(self, item.innerMapping, bytes32(_key), bytes32(_key2)));
    }

    function get(Config storage self, AddressBytes4Bytes32Mapping storage item, address _key, bytes4 _key2) internal constant returns(bytes32) {
        return get(self, item.innerMapping, bytes32(_key), bytes32(_key2));
    }

    function get(Config storage self, AddressUIntUIntMapping storage item, address _key, uint _key2) internal constant returns(uint) {
        return uint(get(self, item.innerMapping, bytes32(_key), bytes32(_key2)));
    }

    function get(Config storage self, AddressUIntUIntUIntMapping storage item, address _key, uint _key2, uint _key3) internal constant returns(uint) {
        return uint(get(self, item.innerMapping, bytes32(_key), bytes32(_key2), bytes32(_key3)));
    }

    function get(Config storage self, AddressAddressUIntMapping storage item, address _key, address _key2) internal constant returns(uint) {
        return uint(get(self, item.innerMapping, bytes32(_key), bytes32(_key2)));
    }

    function get(Config storage self, AddressAddressUInt8Mapping storage item, address _key, address _key2) internal constant returns(uint8) {
        return uint8(get(self, item.innerMapping, bytes32(_key), bytes32(_key2)));
    }

    function get(Config storage self, AddressBytes32Bytes32Mapping storage item, address _key, bytes32 _key2) internal constant returns(bytes32) {
        return get(self, item.innerMapping, bytes32(_key), _key2);
    }

    function get(Config storage self, UIntBytes32Mapping storage item, uint _key) internal constant returns(bytes32) {
        return get(self, item.innerMapping, bytes32(_key));
    }

    function get(Config storage self, UIntAddressMapping storage item, uint _key) internal constant returns(address) {
        return address(get(self, item.innerMapping, bytes32(_key)));
    }

    function get(Config storage self, UIntBoolMapping storage item, uint _key) internal constant returns(bool) {
        return toBool(get(self, item.innerMapping, bytes32(_key)));
    }

    function get(Config storage self, UIntAddressAddressMapping storage item, uint _key, address _key2) internal constant returns(address) {
        return address(get(self, item.innerMapping, bytes32(_key), bytes32(_key2)));
    }

    function get(Config storage self, UIntAddressUIntMapping storage item, uint _key, address _key2) internal constant returns(uint) {
        return uint(get(self, item.innerMapping, bytes32(_key), bytes32(_key2)));
    }

    function get(Config storage self, UIntUIntMapping storage item, uint _key) internal constant returns(uint) {
        return uint(get(self, item.innerMapping, bytes32(_key)));
    }

    function get(Config storage self, UIntEnumMapping storage item, uint _key) internal constant returns(uint8) {
        return uint8(get(self, item.innerMapping, bytes32(_key)));
    }

    function get(Config storage self, AddressUIntAddressUInt8Mapping storage item, address _key, uint _key2, address _key3) internal constant returns(uint8) {
        return uint8(get(self, item.innerMapping, keccak256(_key, _key2, _key3)));
    }

    function get(Config storage self, AddressUIntUIntAddressUInt8Mapping storage item, address _key, uint _key2, uint _key3, address _key4) internal constant returns(uint8) {
        return uint8(get(self, item.innerMapping, keccak256(_key, _key2, _key3, _key4)));
    }

    function get(Config storage self, AddressUIntUIntUIntAddressUInt8Mapping storage item, address _key, uint _key2, uint _key3, uint _key4, address _key5) internal constant returns(uint8) {
        return uint8(get(self, item.innerMapping, keccak256(_key, _key2, _key3, _key4, _key5)));
    }

    function get(Config storage self, UIntUIntBytes32Mapping storage item, uint _key, uint _key2) internal constant returns(bytes32) {
        return get(self, item.innerMapping, bytes32(_key), bytes32(_key2));
    }

    function get(Config storage self, UIntUIntUIntBytes32Mapping storage item, uint _key, uint _key2, uint _key3) internal constant returns(bytes32) {
        return get(self, item.innerMapping, bytes32(_key), bytes32(_key2), bytes32(_key3));
    }

    function get(Config storage self, Bytes32UIntMapping storage item, bytes32 _key) internal constant returns(uint) {
        return uint(get(self, item.innerMapping, _key));
    }


    /// OPERATIONS ON SETS ///

    function includes(Config storage self, Set storage item, bytes32 _value) internal constant returns(bool) {
        return get(self, item.indexes, _value) != 0;
    }

    function includes(Config storage self, AddressesSet storage item, address _value) internal constant returns(bool) {
        return includes(self, item.innerSet, bytes32(_value));
    }

    function count(Config storage self, Set storage item) internal constant returns(uint) {
        return get(self, item.count);
    }

    function count(Config storage self, AddressesSet storage item) internal constant returns(uint) {
        return count(self, item.innerSet);
    }

    function get(Config storage self, Set storage item) internal constant returns(bytes32[]) {
        uint valuesCount = count(self, item);
        bytes32[] memory result = new bytes32[](valuesCount);
        for (uint i = 0; i < valuesCount; i++) {
            result[i] = get(self, item, i);
        }
        return result;
    }

    function get(Config storage self, AddressesSet storage item) internal constant returns(address[]) {
        return toAddresses(get(self, item.innerSet));
    }

    function get(Config storage self, Set storage item, uint _index) internal constant returns(bytes32) {
        return get(self, item.values, bytes32(_index + 1));
    }

    function get(Config storage self, AddressesSet storage item, uint _index) internal constant returns(address) {
        return address(get(self, item.innerSet, _index));
    }


    /// HELPERS ///

    function toBool(bytes32 self) constant returns(bool) {
        return self != bytes32(0);
    }

    function toBytes32(bool self) constant returns(bytes32) {
        return bytes32(self ? 1 : 0);
    }

    function toAddresses(bytes32[] memory self) constant returns(address[]) {
        address[] memory result = new address[](self.length);
        for (uint i = 0; i < self.length; i++) {
            result[i] = address(self[i]);
        }
        return result;
    }
}
