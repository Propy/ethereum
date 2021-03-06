pragma solidity 0.4.24;

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

    event PaymentReceived(address indexed who, uint256 value, uint256 total);                          // Native blockchain
    event PaymentReceived(string indexed who, uint256 value, uint256 total, bytes32 trahsactionId);    // Another blockchain

    event PaymentWithdrawn(address indexed who, uint256 value);
    event PaymentWithdrawn(string indexed who, uint256 value, bytes32 transactionId);

    event PaymentDone(address indexed who, uint256 value, uint256 total);
    event PaymentDone(string indexed who, uint256 value, uint256 total, bytes32 transactionId);

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

    function _receive(address _who, uint256 _value) internal {
        require(_value > 0, "Value must be greater zero!");
        payment += _value;
        if (checkPayment()) {
            emit PaymentDone(_who, _value, payment);
        }
        else {
            emit PaymentReceived(_who, _value, payment);
        }
    }

    function _receive(string _who, uint256 _value, bytes32 _transactionId) internal {
        require(_value > 0, "Value must be greater zero!");
        payment += _value;
        if (checkPayment()) {
            emit PaymentDone(_who, _value, payment, _transactionId);
        }
        else {
            emit PaymentReceived(_who, _value, payment, _transactionId);
        }
    }

    function _withdraw(address _who, uint256 _value) internal {
        require(checkPayment(), "Payment is not done!");
        emit PaymentWithdrawn(_who, _value);
    }

    function _withdraw(string _who, uint256 _value, bytes32 _transactionId) internal {
        require(checkPayment(), "Payment is not done!");
        emit PaymentWithdrawn(_who, _value, _transactionId);
    }

    function getType() public pure returns(uint8) {
        return 0;
    }

    function currencyCode() public view returns(bytes4) {
        return bytes4(0);
    }

}