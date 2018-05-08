pragma solidity 0.4.23;

import "../../base/AddressChecker.sol";
import "../../base/Owned.sol";

contract MetaDeedInterface {
    function movesCount() public constant returns(uint);
    function paymentMoves(uint) public constant returns(uint8);
    function getPaymentMovesCount() public constant returns(uint);
}

contract DeedInterface {
    function action(uint8, bytes32[], bytes32[], uint8) public returns(bool);
    function moves(uint8) public constant returns(uint8);
    function price() public constant returns(uint256);
    function currentPrice() public view returns(uint256);
}

contract Escrow is Owned, AddressChecker {

    DeedInterface public deed;

    uint256 public payment;
    bool public locked;

    /// EVENTS ///

    event PaymentReceived(address who, uint256 value);
    event PaymentAssigned(uint8 unlockAt, address receiver, address returnTo, uint256 value);
    event PaymentWithdrawn(address who, uint256 value);

    constructor (address _deed) public {
        require(_deed != address(0));
        deed = DeedInterface(_deed);
    }

    function checkPayment()
     public
     view
     returns(bool)
    {
        return payment >= deed.price();
    }

    function setLocked(bool _locked)
     public
     only(deed)
     returns(bool previous)
    {
        previous = locked;
        locked = _locked;
    }

    function _setPayment(address _sender, uint256 _value) internal {
        require(_value > 0, "Value must be greater zero!");
        emit PaymentReceived(_sender, _value);
        payment = _value;
    }

}