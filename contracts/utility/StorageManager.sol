pragma solidity 0.4.18;

import "../base/Owned.sol";
import '../adapters/MultiEventsHistoryAdapter.sol';


contract StorageManager is Owned, MultiEventsHistoryAdapter {

    mapping(address => mapping(bytes32 => bool)) internal approvedContracts;


    /// SETTINGS ///

    function setupEventsHistory(address _eventsHistory) public onlyContractOwner returns(bool) {
        if (getEventsHistory() != 0x0) {
            return false;
        }
        _setEventsHistory(_eventsHistory);
        return true;
    }

    /// EVENTS ///

    event AccessGiven(address actor, bytes32 role);
    event AccessBlocked(address actor, bytes32 role);


    /// MAIN FUNCTIONS ///

    function giveAccess(address _actor, bytes32 _role) public onlyContractOwner returns(bool) {
        approvedContracts[_actor][_role] = true;
        _emitAccessGiven(_actor, _role);
        return true;
    }

    function blockAccess(address _actor, bytes32 _role) public onlyContractOwner returns(bool) {
        approvedContracts[_actor][_role] = false;
        _emitAccessBlocked(_actor, _role);
        return true;
    }

    function isAllowed(address _actor, bytes32 _role) public constant returns(bool) {
        return approvedContracts[_actor][_role];
    }


    /// MULTI EVENTS HISTORY ///

    function _emitAccessGiven(address _actor, bytes32 _role) internal {
        StorageManager(getEventsHistory()).emitAccessGiven(_actor, _role);
    }

    function _emitAccessBlocked(address _actor, bytes32 _role) internal {
        StorageManager(getEventsHistory()).emitAccessBlocked(_actor, _role);
    }

    function emitAccessGiven(address _actor, bytes32 _role) public {
        AccessGiven(_actor, _role);
    }

    function emitAccessBlocked(address _actor, bytes32 _role) public {
        AccessBlocked(_actor, _role);
    }


    /// RESTRICTIONS & DISASTER RECOVERY ///

    function kill() public onlyContractOwner {
        selfdestruct(msg.sender);
    }

    // FIXME: Add maintenance mode

}
