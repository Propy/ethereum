pragma solidity 0.4.18;

import "./adapters/StorageAdapter.sol";
import "./base/AddressChecker.sol";
import "./base/Owned.sol";
import './adapters/MultiEventsHistoryAdapter.sol';


contract DeedRegistry is Owned, AddressChecker, StorageAdapter, MultiEventsHistoryAdapter {

    address public controller;

    StorageInterface.AddressesSet allDeeds;
    StorageInterface.AddressBoolMapping deedExists;

    /// EVENTS ///

    event DeedRegistered(address self, address addr);
    event DeedRemoved(address self, address addr);


    /// CONSTRUCTOR ///

    function DeedRegistry(
        Storage _store,
        bytes32 _crate,
        address _controller
    ) StorageAdapter(_store, _crate) {
        assert(_controller != address(0));
        controller = _controller;

        allDeeds.init("allDeeds");
        deedExists.init("deedExists");
    }


    /// SETTINGS ///

    function setupEventsHistory(address _eventsHistory) onlyContractOwner returns(bool) {
        if (getEventsHistory() != 0x0) {
            return false;
        }
        _setEventsHistory(_eventsHistory);
        return true;
    }

    function setController(address _controller)
        onlyContractOwner
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

    function registered(address _deed) public constant returns(bool) {
        return store.get(deedExists, _deed);
    }

    function includes(address _deed) constant returns(bool) {
        return store.includes(allDeeds, _deed);
    }

    function count() constant returns(uint256) {
        return store.count(allDeeds);
    }

    function getAll() public constant returns(address[]) {
        return store.get(allDeeds);
    }


    /// MULTI EVENTS HISTORY ///

    function _emitDeedRegistered(address _deed) internal {
        DeedRegistry(getEventsHistory()).emitDeedRegistered(_deed);
    }

    function _emitDeedRemoved(address _deed) internal {
        DeedRegistry(getEventsHistory()).emitDeedRemoved(_deed);
    }

    function emitDeedRegistered(address _deed) {
        DeedRegistered(_self(), _deed);
    }

    function emitDeedRemoved(address _deed) {
        DeedRemoved(_self(), _deed);
    }

    /// RESTRICTIONS & DISASTER RECOVERY ///

    function kill() public onlyContractOwner {
        selfdestruct(msg.sender);
    }

    // FIXME: Add maintenance mode

}
