pragma solidity ^0.4.18;


contract AddressChecker {

    event Error(string msg);

    modifier notNull(address _address) {
        if (_address == address(0)) {
            emit Error("Null address.");
            return;
        }
        _;
    }

    modifier only(address _address) {
        if (msg.sender != _address) {
            emit Error("Unathorized caller.");
            return;
        }
        _;
    }

}
