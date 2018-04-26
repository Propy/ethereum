pragma solidity 0.4.23;

import './Escrow.sol';

contract EscrowDeposit is Escrow {

    uint256 public depositAmount;

    event Deposit(uint256 value, uint256 sum);

    constructor (address _deed) Escrow(_deed) public {}

    function deposit(uint256 _value)
     external
     onlyContractOwner
    {
        require((depositAmount + _value) > depositAmount, "Wrong math!");
        depositAmount += _value;
        emit Deposit(_value, depositAmount);
        _setPayment(msg.sender, depositAmount);
    }

}