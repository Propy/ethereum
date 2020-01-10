pragma solidity 0.5.8;

import "./MultiEventsHistoryAdapter.sol";
import "./StorageAdapter.sol";
import "./Owned.sol";


contract RolesLibrary is StorageAdapter, MultiEventsHistoryAdapter, Owned {
    StorageInterface.AddressBoolMapping rootUsers;
    StorageInterface.AddressBytes32Mapping userRoles;
    StorageInterface.AddressBytes4Bytes32Mapping capabilityRoles;
    StorageInterface.AddressBytes4BoolMapping publicCapabilities;

    event RoleAdded(address indexed self, address indexed user, uint8 indexed role);
    event RoleRemoved(address indexed self, address indexed user, uint8 indexed role);
    event CapabilityAdded(address indexed self, address indexed code, bytes4 sig, uint8 indexed role);
    event CapabilityRemoved(address indexed self, address indexed code, bytes4 sig, uint8 indexed role);
    event PublicCapabilityAdded(address indexed self, address indexed code, bytes4 sig);
    event PublicCapabilityRemoved(address indexed self, address indexed code, bytes4 sig);

    modifier authorized() {
        if (msg.sender != contractOwner && !canCall(msg.sender, address(this), msg.sig)) {
            return;
        }
        _;
    }

    constructor(Storage _store, bytes32 _crate) StorageAdapter(_store, _crate) public {
        rootUsers.init('rootUsers');
        userRoles.init('userRoles');
        capabilityRoles.init('capabilityRoles');
        publicCapabilities.init('publicCapabilities');
    }

    function setupEventsHistory(address _eventsHistory) onlyContractOwner public returns(bool) {
        if (getEventsHistory() != address(0)) {
            return false;
        }
        _setEventsHistory(_eventsHistory);
        return true;
    }

    function getUserRoles(address _user) view public returns(bytes32) {
        return store.get(userRoles, _user);
    }

    function getCapabilityRoles(address _code, bytes4 _sig) view public returns(bytes32) {
        return store.get(capabilityRoles, _code, _sig);
    }

    function canCall(address _user, address _code, bytes4 _sig) view public returns(bool) {
        if (isUserRoot(_user) || isCapabilityPublic(_code, _sig)) {
            return true;
        }
        return bytes32(0) != getUserRoles(_user) & getCapabilityRoles(_code, _sig);
    }

    function bitNot(bytes32 _input) pure public returns(bytes32) {
        return (_input ^ bytes32(uint(-1)));
    }

    function setRootUser(address _user, bool _enabled) onlyContractOwner public returns(bool) {
        store.set(rootUsers, _user, _enabled);
        return true;
    }

    function addUserRole(address _user, uint8 _role) authorized() public returns(bool) {
        if (hasUserRole(_user, _role)) {
            return false;
        }
        return _setUserRole(_user, _role, true);
    }

    function removeUserRole(address _user, uint8 _role) authorized() public returns(bool) {
        if (!hasUserRole(_user, _role)) {
            return false;
        }
        return _setUserRole(_user, _role, false);
    }

    function _setUserRole(address _user, uint8 _role, bool _enabled) internal returns(bool) {
        bytes32 lastRoles = getUserRoles(_user);
        bytes32 shifted = _shift(_role);
        if (_enabled) {
            store.set(userRoles, _user, lastRoles | shifted);
            _emitRoleAdded(_user, _role);
        } else {
            store.set(userRoles, _user, lastRoles & bitNot(shifted));
            _emitRoleRemoved(_user, _role);
        }
        return true;
    }

    function setPublicCapability(address _code, bytes4 _sig, bool _enabled) onlyContractOwner public returns(bool) {
        store.set(publicCapabilities, _code, _sig, _enabled);
        if (_enabled) {
            _emitPublicCapabilityAdded(_code, _sig);
        } else {
            _emitPublicCapabilityRemoved(_code, _sig);
        }
        return true;
    }

    function addRoleCapability(uint8 _role, address _code, bytes4 _sig) public returns(bool) {
        return setRoleCapability(_role, _code, _sig, true);
    }

    function removeRoleCapability(uint8 _role, address _code, bytes4 _sig) public returns(bool) {
        if (getCapabilityRoles(_code, _sig) == 0) {
            return false;
        }
        return setRoleCapability(_role, _code, _sig, false);
    }

    function setRoleCapability(uint8 _role, address _code, bytes4 _sig, bool _enabled) onlyContractOwner public returns(bool) {
        bytes32 lastRoles = getCapabilityRoles(_code, _sig);
        bytes32 shifted = _shift(_role);
        if (_enabled) {
            store.set(capabilityRoles, _code, _sig, lastRoles | shifted);
            _emitCapabilityAdded(_code, _sig, _role);
        } else {
            store.set(capabilityRoles, _code, _sig, lastRoles & bitNot(shifted));
            _emitCapabilityRemoved(_code, _sig, _role);
        }
        return true;
    }

    function isUserRoot(address _user) view public returns(bool) {
        return store.get(rootUsers, _user);
    }

    function isCapabilityPublic(address _code, bytes4 _sig) view public returns(bool) {
        return store.get(publicCapabilities, _code, _sig);
    }

    function hasUserRole(address _user, uint8 _role) view public returns (bool) {
        return bytes32(0) != getUserRoles(_user) & _shift(_role);
    }

    function _shift(uint8 _role) pure internal returns(bytes32) {
        return bytes32(uint(uint(2) ** uint(_role)));
    }


    function _emitRoleAdded(address _user, uint8 _role) internal {
        RolesLibrary(getEventsHistory()).emitRoleAdded(_user, _role);
    }

    function _emitRoleRemoved(address _user, uint8 _role) internal {
        RolesLibrary(getEventsHistory()).emitRoleRemoved(_user, _role);
    }

    function _emitCapabilityAdded(address _code, bytes4 _sig, uint8 _role) internal {
        RolesLibrary(getEventsHistory()).emitCapabilityAdded(_code, _sig, _role);
    }

    function _emitCapabilityRemoved(address _code, bytes4 _sig, uint8 _role) internal {
        RolesLibrary(getEventsHistory()).emitCapabilityRemoved(_code, _sig, _role);
    }

    function _emitPublicCapabilityAdded(address _code, bytes4 _sig) internal {
        RolesLibrary(getEventsHistory()).emitPublicCapabilityAdded(_code, _sig);
    }

    function _emitPublicCapabilityRemoved(address _code, bytes4 _sig) internal {
        RolesLibrary(getEventsHistory()).emitPublicCapabilityRemoved(_code, _sig);
    }

    function emitRoleAdded(address _user, uint8 _role) public {
        emit RoleAdded(_self(), _user, _role);
    }

    function emitRoleRemoved(address _user, uint8 _role) public {
        emit RoleRemoved(_self(), _user, _role);
    }

    function emitCapabilityAdded(address _code, bytes4 _sig, uint8 _role) public {
        emit CapabilityAdded(_self(), _code, _sig, _role);
    }

    function emitCapabilityRemoved(address _code, bytes4 _sig, uint8 _role) public {
        emit CapabilityRemoved(_self(), _code, _sig, _role);
    }

    function emitPublicCapabilityAdded(address _code, bytes4 _sig) public {
        emit PublicCapabilityAdded(_self(), _code, _sig);
    }

    function emitPublicCapabilityRemoved(address _code, bytes4 _sig) public {
        emit PublicCapabilityRemoved(_self(), _code, _sig);
    }
}
