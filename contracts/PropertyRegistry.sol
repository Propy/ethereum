pragma solidity 0.4.24;

import './adapters/MultiEventsHistoryAdapter.sol';
import "./adapters/RolesLibraryAdapter.sol";
import "./adapters/StorageAdapter.sol";
import "./base/AddressChecker.sol";


contract PropertyRegistry is AddressChecker, StorageAdapter, MultiEventsHistoryAdapter, RolesLibraryAdapter {

    address public controller;

    StorageInterface.AddressesSet relevantContracts;
    StorageInterface.AddressesSet obsoleteContracts;
    StorageInterface.AddressBoolMapping propertyExists;


    /// EVENTS ///

    event PropertyRegistered(address self, address propertyAddress);
    event PropertyRemoved(address self, address propertyAddress);


    /// CONSTRUCTOR ///

    constructor(
        Storage _store,
        bytes32 _crate,
        address _controller,
        address _rolesLibrary
    ) StorageAdapter(_store, _crate) RolesLibraryAdapter(_rolesLibrary) public  {
        assert(_controller != address(0));
        controller = _controller;

        relevantContracts.init("relevantContracts");
        propertyExists.init("propertyExists");
    }


    /// SETTINGS ///

    function setupEventsHistory(address _eventsHistory) auth public returns(bool) {
      if (getEventsHistory() != 0x0) {
          return false;
      }
      _setEventsHistory(_eventsHistory);
      return true;
    }

    function setController(address _controller)
        public
        auth
        notNull(_controller)
    returns(bool) {
        if (controller == _controller) {
            _emitError("Attempt to change to the same value");
            return false;
        }
        _emitServiceChanged("Controller", controller, _controller);
        controller = _controller;
        return true;
    }


    /// MAIN FUNCTIONS ///

    function register(address _property)
        public
        only(controller)
        notNull(_property)
    returns(bool) {
        if (relevant(_property) || includes(_property) || obsolete(_property)) {
            return false;
        }
        store.add(relevantContracts, _property);
        store.set(propertyExists, _property, true);

        _emitPropertyRegistered(_property);
        return true;
    }

    function remove(address _property, bool _migrated)
        public
        only(controller)
        notNull(_property)
    returns(bool success) {
        if (relevant(_property)) {
            store.set(propertyExists, _property, false);
            success = true;
        }
        if (includes(_property)) {
            store.remove(relevantContracts, _property);
            success = true;
            _emitPropertyRemoved(_property);
        }

        // If contract has migrated, add it to the obsolete list
        if (_migrated) {
            store.add(obsoleteContracts, _property);
        }
    }


    /// GETTERS ///

    function relevant(address _property) public constant returns(bool) {
        return store.get(propertyExists, _property);
    }

    function obsolete(address _property) constant public returns(bool) {
        return store.includes(obsoleteContracts, _property);
    }

    function includes(address _property) constant public returns(bool) {
        return store.includes(relevantContracts, _property);
    }

    function count() constant public returns(uint256) {
        return store.count(relevantContracts);
    }

    function getAllRelevant() public constant returns(address[]) {
        return store.get(relevantContracts);
    }

    function getAllObsolete() public constant returns(address[]) {
        return store.get(obsoleteContracts);
    }

    /// MULTI EVENTS HISTORY ///

    function _emitPropertyRegistered(address _property) internal {
        PropertyRegistry(getEventsHistory()).emitPropertyRegistered(_property);
    }

    function _emitPropertyRemoved(address _property) internal {
        PropertyRegistry(getEventsHistory()).emitPropertyRemoved(_property);
    }

    function emitPropertyRegistered(address _property) public {
        emit PropertyRegistered(_self(), _property);
    }

    function emitPropertyRemoved(address _property) public {
        emit PropertyRemoved(_self(), _property);
    }


    /// RESTRICTIONS & DISASTER RECOVERY ///

    function kill() public auth {
        selfdestruct(msg.sender);
    }

    // FIXME: Add maintenance mode

}
