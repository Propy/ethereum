pragma solidity 0.4.24;

/**
 * @title General MultiEventsHistory user.
 *
 */
contract MultiEventsHistoryAdapter {
    address eventsHistory;

    event Error(address indexed self, string msg);
    event ServiceChanged(address self, string name, address oldAddress, address newAddress);

    // Helpers
    modifier notNull(address _address) {
        if (_address == address(0)) {
            _emitError("Null address.");
            return;
        }
        _;
    }

    modifier only(address _address) {
        if (msg.sender != _address) {
            _emitError("Unauthorized caller.");
            return;
        }
        _;
    }

    function getEventsHistory() constant returns(address) {
        return eventsHistory;
    }

    function _setEventsHistory(address _eventsHistory) internal {
        eventsHistory = _eventsHistory;
    }

    // It is address of MultiEventsHistory caller assuming we are inside of delegate call.
    function _self() constant internal returns(address) {
        return msg.sender;
    }

    function _emitError(string _msg) internal {
        MultiEventsHistoryAdapter(getEventsHistory()).emitError(_msg);
    }

    function emitError(string _msg) {
        Error(_self(), _msg);
    }

    function _emitServiceChanged(string _name, address _oldAddress, address _newAddress) internal {
        MultiEventsHistoryAdapter(getEventsHistory()).emitServiceChanged(_name, _oldAddress, _newAddress);
    }

    function emitServiceChanged(string _name, address _oldAddress, address _newAddress) {
        ServiceChanged(_self(), _name, _oldAddress, _newAddress);
    }

}
