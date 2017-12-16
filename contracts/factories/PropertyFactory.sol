pragma solidity 0.4.18;

import "../disposable/Property.sol";
import "../base/AddressChecker.sol";
import "../base/Owned.sol";
import '../adapters/MultiEventsHistoryAdapter.sol';


contract PropertyFactory is Owned, AddressChecker, MultiEventsHistoryAdapter {

    address public controller;
    address public proxy;

    /// EVENTS ///

    event PropertyCreated(address self, address propertyAddress);


    /// CONSTRUCTOR ///

    function PropertyFactory(address _controller, address _proxy) {
        assert(_controller != address(0) && _proxy != address(0));
        controller = _controller;
        proxy = _proxy;
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

    function setProxy(address _proxy)
        onlyContractOwner
        notNull(_proxy)
    returns(bool) {
        proxy = _proxy;
        return true;
    }


    /// MAIN FUNCTIONS ///

    function createProperty(
        address _previousVersion, address _owner, string _name, string _physicalAddress, uint8 _areaType, uint256 _area
    )
        only(controller)
    returns(address) {
        // FIXME : Check physical address?
        address property = new Property(_previousVersion, _owner, _name, _physicalAddress, _areaType, _area);
        Property CreatedProperty = Property(property);
        assert(CreatedProperty.forceChangeContractOwnership(proxy));
        _emitPropertyCreated(property);
        return property;
    }

    /// MULTI EVENTS HISTORY ///

    function _emitPropertyCreated(address _property) internal {
        PropertyFactory(getEventsHistory()).emitPropertyCreated(_property);
    }

    function emitPropertyCreated(address _property) {
        PropertyCreated(_self(), _property);
    }


    /// RESTRICTIONS & DISASTER RECOVERY ///

    function kill() public onlyContractOwner {
        selfdestruct(msg.sender);
    }

    // FIXME: Add maintenance mode

}
