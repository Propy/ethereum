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

    /// EVENTS ///

    event PaymentReceived(uint8 move, address who, uint256 value);
    event PaymentAssigned(uint8 move, uint8 unlockAt, address receiver, address returnTo, uint256 value);
    event PaymentWithdrawn(uint8 move, address who, uint256 value);

    function Escrow(address _deed) public {
        require(_deed != address(0));
        deed = DeedInterface(_deed);
    }

    function checkPayment(uint256 _price)
     public
     view
     only(deed)
     returns(bool)
    {
        return payment >= _price;
    }

    function _setPayment(address _sender, uint256 _value) internal {
        require(_value > 0);
        emit PaymentReceived(move, _sender, _value);
        payment = _value;
    }

}