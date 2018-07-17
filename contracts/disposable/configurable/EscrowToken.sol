<<<<<<< HEAD
pragma solidity 0.4.24;
=======
pragma solidity 0.4.23;
>>>>>>> master

import './Escrow.sol';

contract ERC20Interface {
    function transfer(address, uint256) public returns(bool);
    function balanceOf(address) public constant returns(uint256);
}

contract EscrowToken is Escrow {

    ERC20Interface public token;

    event Deposit(uint256 value, uint256 sum);
    event Withdraw(uint256 value, address who);

    constructor (address _deed, address _token) Escrow(_deed) public {
        token = ERC20Interface(_token);
    }

    function checkPayment()
     public
     view
     returns(bool)
    {
        return balance() >= deed.price();
    }

    function balance() public view returns(uint256) {
        return token.balanceOf(address(this));
    }

    function withdraw(address _who, uint256 _value)
     external
     onlyContractOwner
    {
        require(!locked, "Escrow session is locked!");
        require(balance() >= _value, "Contract hasn't money!");
        token.transfer(_who, _value);
        emit Withdraw(_value, _who);
    }

    /// For ERC223 Tokens
    function tokenFallback(address _who, uint256 _value, bytes) public {
        require(!locked, "Escrow session is locked!");
        require(msg.sender == address(token));
        emit Deposit(_value, balance());
        _setPayment(_who, balance());
    }

}