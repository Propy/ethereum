<<<<<<< HEAD
pragma solidity 0.4.24;
=======
pragma solidity 0.4.23;
>>>>>>> master

import './Escrow.sol';

contract EscrowEther is Escrow {

    uint256 public depositAmount;
<<<<<<< HEAD
    mapping(address => uint256) public users;

    event Deposit(uint256 value, uint256 sum);
    event Withdraw(uint256 value, address to);
=======
    mapping(address => uint256) users;

    event Deposit(uint256 value, uint256 sum);
    event Withdraw(uint256 value, address who);
>>>>>>> master

    constructor (address _deed) Escrow(_deed) public {}

    function ()
     external
     payable
    {
        require(!locked, "Escrow session is locked!");
        uint256 _value = msg.value;
        require((depositAmount + _value) > depositAmount, "Wrong value!");
        depositAmount += _value;
        users[msg.sender] += _value;
        emit Deposit(_value, depositAmount);
        _setPayment(msg.sender, depositAmount);
    }

    function withdraw(address _who, uint256 _value)
     external
     onlyContractOwner
    {
        require(!locked, "Escrow session is locked!");
        require((depositAmount - _value) < depositAmount, "Wrong value!");
        require(depositAmount >= _value, "Contract hasn't need money!");
        depositAmount -= _value;
        _who.transfer(_value);
        emit Withdraw(_value, _who);
    }

}