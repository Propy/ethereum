pragma solidity 0.4.24;

import './Escrow.sol';

contract ERC20Interface {
    function transfer(address, uint256) public returns(bool);
    function balanceOf(address) public constant returns(uint256);
    function symbol() public constant returns(string);
}

contract EscrowToken is Escrow {

    ERC20Interface public token;

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
        _withdraw(_who, _value);
    }

    /// For ERC223 Tokens
    function tokenFallback(address _who, uint256 _value, bytes) public {
        require(!locked, "Escrow session is locked!");
        require(msg.sender == address(token));
        _receive(_who, _value);
    }

    function getType() public pure returns(uint8) {
        return 3;
    }

    function currencyCode() public view returns(bytes4 result) {
        string memory sym = token.symbol();
        assembly {
            result := mload(add(sym, 32))
        }
    }

}