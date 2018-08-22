pragma solidity 0.4.24;

import './Escrow.sol';

contract EscrowDeposit is Escrow {

    uint256 public depositAmount;

    constructor (address _deed) Escrow(_deed) public {}

    function deposit(uint256 _value)
     external
     onlyContractOwner
    {
        require(!locked, "Escrow session is locked!");
        require((depositAmount + _value) > depositAmount, "Wrong math!");
        depositAmount += _value;
        _receive(msg.sender, depositAmount);
    }

    function getType() public pure returns(uint8) {
        return 1;
    }

}