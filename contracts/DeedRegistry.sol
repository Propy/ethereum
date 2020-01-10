pragma solidity 0.5.8;

import "./StorageAdapter.sol";
import "./AddressChecker.sol";
import './MultiEventsHistoryAdapter.sol';
import "./RolesLibraryAdapter.sol";


contract DeedRegistry is RolesLibraryAdapter, AddressChecker, StorageAdapter, MultiEventsHistoryAdapter {

    address public controller;

    StorageInterface.AddressesSet allDeeds;
    StorageInterface.AddressBoolMapping deedExists;

    /// EVENTS ///

    event DeedRegistered(address self, address addr);
    event DeedRemoved(address self, address addr);


    /// CONSTRUCTOR ///

    constructor(
        Storage _store,
        bytes32 _crate,
        address _controller,
        address _rolesLibrary
    ) public StorageAdapter(_store, _crate) RolesLibraryAdapter(_rolesLibrary) {
        assert(_controller != address(0));
        controller = _controller;

        allDeeds.init("allDeeds");
        deedExists.init("deedExists");
    }


    /// SETTINGS ///

    function setupEventsHistory(address _eventsHistory) auth public returns(bool) {
        if (getEventsHistory() != address(0)) {
            return false;
        }
        _setEventsHistory(_eventsHistory);
        return true;
    }

    function setController(address _controller)
        auth
        notNull(_controller)
        public
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

    function register(address _deed) public only(controller) notNull(_deed) returns(bool) {
        if (registered(_deed) || includes(_deed)) {
            return false;
        }

        store.add(allDeeds, _deed);
        store.set(deedExists, _deed, true);

        _emitDeedRegistered(_deed);
        return true;
    }

    function remove(address _deed) public only(controller) notNull(_deed) returns(bool success) {
        if (registered(_deed)) {
            store.set(deedExists, _deed, false);
            success = true;
        }
        if (includes(_deed)) {
            store.remove(allDeeds, _deed);
            success = true;
            _emitDeedRemoved(_deed);
        }
    }


    /// GETTERS ///

    function registered(address _deed) public view returns(bool) {
        return store.get(deedExists, _deed);
    }

    function includes(address _deed) public view returns(bool) {
        return store.includes(allDeeds, _deed);
    }

    function count() public view returns(uint256) {
        return store.count(allDeeds);
    }

    function getAll() public view returns(address[] memory) {
        return store.get(allDeeds);
    }


    /// MULTI EVENTS HISTORY ///

    function _emitDeedRegistered(address _deed) internal {
        DeedRegistry(getEventsHistory()).emitDeedRegistered(_deed);
    }

    function _emitDeedRemoved(address _deed) internal {
        DeedRegistry(getEventsHistory()).emitDeedRemoved(_deed);
    }

    function emitDeedRegistered(address _deed) public{
        emit DeedRegistered(_self(), _deed);
    }

    function emitDeedRemoved(address _deed) public {
        emit DeedRemoved(_self(), _deed);
    }

    /// RESTRICTIONS & DISASTER RECOVERY ///

    function kill() public auth {
        selfdestruct(msg.sender);
    }

    // FIXME: Add maintenance mode

}

