pragma solidity 0.4.24;

import './Escrow.sol';

contract EscrowEther is Escrow {

    address public userAddress;
    uint256 public depositAmount;
    mapping(address => uint256) public users;

    event Deposit(uint256 value, uint256 sum);
    event Withdraw(uint256 value, address to);

    constructor (address _deed, address _userAddress) Escrow(_deed) public {
        userAddress = _userAddress;
    }

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


    function setUserAddress(address _userAddress) public onlyContractOwner {
        userAddress = _userAddress;
    }

    function getType() public pure returns(uint8) {
        return 2;
    }

}