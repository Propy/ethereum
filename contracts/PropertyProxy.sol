pragma solidity 0.4.18;

import "./base/AddressChecker.sol";
import "./adapters/MultiEventsHistoryAdapter.sol";
import "./adapters/RolesLibraryAdapter.sol";


contract PropertyInterface {
    function forceChangeContractOwnership(address) returns(bool);
    function setPropertyToPendingState(address) returns(bool);
    function migrate(address) returns(bool);
}

contract PropertyProxy is RolesLibraryAdapter, AddressChecker, MultiEventsHistoryAdapter {

    address public controller;

    function PropertyProxy(
        address _controller,
        address _rolesLibrary
    ) RolesLibraryAdapter(_rolesLibrary) {
        assert(_controller != address(0) && _rolesLibrary != address(0));
        controller = _controller;
    }

    /// SETTINGS ///

    function setupEventsHistory(address _eventsHistory) public auth returns(bool) {
        if (getEventsHistory() != 0x0) {
            return false;
        }
        _setEventsHistory(_eventsHistory);
        return true;
    }

    function setController(address _controller)
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
