pragma solidity 0.5.8;

import "./AddressChecker.sol";
import "./MultiEventsHistoryAdapter.sol";
import "./RolesLibraryAdapter.sol";


contract PropertyInterface {
    function forceChangeContractOwnership(address) public returns(bool);
    function setPropertyToPendingState(address) public returns(bool);
    function migrate(address) public returns(bool);
}

contract PropertyProxy is RolesLibraryAdapter, AddressChecker, MultiEventsHistoryAdapter {

    address public controller;

    constructor(
        address _controller,
        address _rolesLibrary
    ) RolesLibraryAdapter(_rolesLibrary)
    public
    {
        assert(_controller != address(0) && _rolesLibrary != address(0));
        controller = _controller;
    }

    /// SETTINGS ///

    function setupEventsHistory(address _eventsHistory) public auth returns(bool) {
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

    function setPropertyToPendingState(address _property, address _deed)
        public
        only(controller)
    returns(bool) {
        PropertyInterface Property = PropertyInterface(_property);
        return Property.setPropertyToPendingState(_deed);
    }

    // Change `_property` contract ownership `_to` new version of PropertyProxy
    function forcePropertyChangeContractOwnership(address _property, address _to)
        public
        auth
    returns(bool) {
        // NOTE : Maybe better switch to `assert`
        if (_property == address(0) || _to == address(0)) {
            return false;
        }
        PropertyInterface Property = PropertyInterface(_property);
        return Property.forceChangeContractOwnership(_to);
    }

    function migrateProperty(address _property, address _to) public only(controller) returns(bool) {
        PropertyInterface Property = PropertyInterface(_property);
        return Property.migrate(_to);
    }


    /// RESTRICTIONS & DISASTER RECOVERY ///

    function kill() public auth {
        selfdestruct(msg.sender);
    }

    // FIXME: Add maintenance mode

}

