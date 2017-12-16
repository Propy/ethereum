pragma solidity 0.4.18;


contract AddressChecker {

    event Error(string msg);

    modifier notNull(address _address) {
        if (_address == address(0)) {
            Error("Null address.");
            return;
        }
        _;
    }

    modifier only(address _address) {
        if (msg.sender != _address) {
            Error("Unathorized caller.");
            return;
        }
        _;
    }

}
