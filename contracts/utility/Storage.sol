pragma solidity 0.4.23;

import "../base/Owned.sol";


contract Manager {
    function isAllowed(address _actor, bytes32 _role) constant returns(bool);
}

contract Storage is Owned {

    struct Crate {
        mapping(bytes32 => uint) uints;
        mapping(bytes32 => address) addresses;
        mapping(bytes32 => bool) bools;
        mapping(bytes32 => int) ints;
        mapping(bytes32 => uint8) uint8s;
        mapping(bytes32 => bytes32) bytes32s;
    }

    mapping(bytes32 => Crate) crates;
    Manager public manager;

    modifier onlyAllowed(bytes32 _role) {
        if (!manager.isAllowed(msg.sender, _role)) {
            revert();
        }
        _;
    }

    function setManager(Manager _manager) onlyContractOwner returns(bool) {
        manager = _manager;
        return true;
    }

    function setUInt(bytes32 _crate, bytes32 _key, uint _value) onlyAllowed(_crate) {
        crates[_crate].uints[_key] = _value;
    }

    function getUInt(bytes32 _crate, bytes32 _key) constant returns(uint) {
        return crates[_crate].uints[_key];
    }

    function setUInt8(bytes32 _crate, bytes32 _key, uint8 _value) onlyAllowed(_crate) {
        crates[_crate].uint8s[_key] = _value;
    }

    function getUInt8(bytes32 _crate, bytes32 _key) constant returns(uint8) {
        return crates[_crate].uint8s[_key];
    }

    function setInt(bytes32 _crate, bytes32 _key, int _value) onlyAllowed(_crate) {
        crates[_crate].ints[_key] = _value;
    }

    function getInt(bytes32 _crate, bytes32 _key) constant returns(int) {
        return crates[_crate].ints[_key];
    }

    function setAddress(bytes32 _crate, bytes32 _key, address _value) onlyAllowed(_crate) {
        crates[_crate].addresses[_key] = _value;
    }

    function getAddress(bytes32 _crate, bytes32 _key) constant returns(address) {
        return crates[_crate].addresses[_key];
    }

    function setBool(bytes32 _crate, bytes32 _key, bool _value) onlyAllowed(_crate) {
        crates[_crate].bools[_key] = _value;
    }

    function getBool(bytes32 _crate, bytes32 _key) constant returns(bool) {
        return crates[_crate].bools[_key];
    }

    function setBytes32(bytes32 _crate, bytes32 _key, bytes32 _value) onlyAllowed(_crate) {
        crates[_crate].bytes32s[_key] = _value;
    }

    function getBytes32(bytes32 _crate, bytes32 _key) constant returns(bytes32) {
        return crates[_crate].bytes32s[_key];
    }


    /// RESTRICTIONS & DISASTER RECOVERY ///

    function kill() public onlyContractOwner {
        selfdestruct(msg.sender);
    }

    // FIXME: Add maintenance mode


}
