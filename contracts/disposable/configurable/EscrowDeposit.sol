pragma solidity 0.4.24;

import './Escrow.sol';

contract EscrowDeposit is Escrow {

    uint256 public depositAmount;
    string public currency;

    constructor (address _deed, string _currency) Escrow(_deed) public {
        currency = _currency;
    }

    function deposit(uint256 _value)
     external
     onlyContractOwner
    {
        require(!locked, "Escrow session is locked!");
        require((depositAmount + _value) > depositAmount, "Wrong math!");
        depositAmount += _value;
        _receive(msg.sender, _value);
    }

    function getType() public pure returns(uint8) {
        return 1;
    }

    function currencyCode() public view returns(bytes4 result) {
        assembly {
            result := sload(currency_slot)
        }
    }

}