pragma solidity 0.5.8;

import "./Property.sol";
import "./AddressChecker.sol";
import "./MultiEventsHistoryAdapter.sol";
import "./RolesLibraryAdapter.sol";


contract PropertyFactory is RolesLibraryAdapter, AddressChecker, MultiEventsHistoryAdapter {

    address public controller;
    address public proxy;

    /// EVENTS ///

    event PropertyCreated(address self, address propertyAddress);


    /// CONSTRUCTOR ///

    constructor(address _controller, address _proxy, address _rolesLibrary)
        RolesLibraryAdapter(_rolesLibrary)
        public
    {
        assert(_controller != address(0) && _proxy != address(0));
        controller = _controller;
        proxy = _proxy;
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

    function setProxy(address _proxy)
        auth
        notNull(_proxy)
        public
    returns(bool) {
        proxy = _proxy;
        return true;
    }


    /// MAIN FUNCTIONS ///

    function createProperty(
        address _previousVersion, address _owner, string memory _name, string memory _physicalAddress, uint8 _areaType, uint256 _area
    ) public
        only(controller)
    returns(address) {
        // FIXME : Check physical address?
        Property CreatedProperty = new Property(_previousVersion, _owner, _name, _physicalAddress, _areaType, _area);
        assert(CreatedProperty.forceChangeContractOwnership(proxy));
        _emitPropertyCreated(address(CreatedProperty));
        return address(CreatedProperty);
    }

    /// MULTI EVENTS HISTORY ///

    function _emitPropertyCreated(address _property) internal {
        PropertyFactory(getEventsHistory()).emitPropertyCreated(_property);
    }

    function emitPropertyCreated(address _property) public {
        emit PropertyCreated(_self(), _property);
    }


    /// RESTRICTIONS & DISASTER RECOVERY ///

    function kill() public auth {
        selfdestruct(msg.sender);
    }

    // FIXME: Add maintenance mode

}
