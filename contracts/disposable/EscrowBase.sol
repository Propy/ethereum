pragma solidity ^0.4.18;


import "../base/AddressChecker.sol";
import "../base/Owned.sol";

contract MetaDeedInterface {
    function movesCount() public constant returns(uint);
    function paymentMoves(uint) public constant returns(uint8);
    function getPaymentMovesCount() public constant returns(uint);
}

contract DeedInterface {
    function action(uint8, bytes32[], bytes32[], uint8) public returns(bool);
    function moves(uint8) public constant returns(uint8);
    function price() public constant returns(uint256);
}

contract EscrowBase is Owned, AddressChecker {

    MetaDeedInterface public metaDeed;
    DeedInterface public deed;

    // Array of awaiting payment amounts.
    uint8[] public paymentMoves;
    // Index of current payment.
    uint8 public currentMoveIndex;

    mapping (uint8 => uint256) public payments;

    enum MoveStatus {
        NOT_SET,
        SUCCESS,
        FAILED
    }


    struct Withdrawal {
        uint8 unlockAt;
        address receiver;  // Send money to `receiver` if move is successful
        address returnTo;  // Send money to `returnTo` if move fails
        bool done;
    }
    mapping (uint8 => Withdrawal) public withdrawals;  // `paymentMove` => `Withdrawal`


    /// EVENTS ///

    event PaymentReceived(uint8 move, address who, uint256 value);
    event PaymentAssigned(uint8 move, uint8 unlockAt, address receiver, address returnTo, uint256 value);
    event PaymentWithdrawn(uint8 move, address who, uint256 value);
    event Initiated(uint256 total);


    /// CONSTRUCTOR ///

    function EscrowBase(address _metaDeed, address _deed) {
        require(
            _metaDeed != address(0) &&
            _deed != address(0)
        );
        metaDeed = MetaDeedInterface(_metaDeed);
        deed = DeedInterface(_deed);
    }


    /**
     * Take an array of future `_payments`. It must be the same length as
     * `paymentsArray` at MetaDeed contract, that contains move IDs,
     * related to these payments.
     *
     * Also, check that the sum of all `_payments` is >= `price` from Deed contract.
     */
    function init(uint256 _price, uint256[] _payments) public only(deed) returns(bool) {
        if (_price <= 0) {
            Error("Price can not be zero.");
            return false;
        }
        if (_payments.length != metaDeed.getPaymentMovesCount()) {
            Error("Payment arrays do not match.");
            return false;
        }

        // FIXME: Do safe math checks
        uint256 total;
        for (uint8 p = 0; p < _payments.length; p++) {
            if (_payments[p] <= 0) {
                Error("Payment amount can not be zero.");
                return false;
            }
            total += _payments[p];
        }
        // Ensure that `payments` include `price`.
        if (total < _price) {
            Error("Sum of all payments can not be less than Property price.");
            return false;
        }


        for (uint8 i = 0; i < _payments.length; i++) {
            uint8 move = metaDeed.paymentMoves(i);
            require(move > 0);
            assert(payments[move] == 0);

            payments[move] = _payments[i];
            paymentMoves[i] = move;
        }

        currentMoveIndex = 0;  // Explicit assignment, just in case.
        Initiated(total);
        return true;
    }

    function reInit(uint256 _price, uint256[] _payments) public only(deed) returns(bool) {
        if (_price <= 0) {
            Error("Price can not be zero.");
            return false;
        }
        if (_payments.length != metaDeed.getPaymentMovesCount()) {
            Error("Payment arrays do not match.");
            return false;
        }

        // FIXME: Do safe math checks
        uint256 total;
        for (uint8 p = 0; p < _payments.length; p++) {
            if (_payments[p] <= 0) {
                Error("Payment amount can not be zero.");
                return false;
            }
            total += _payments[p];
        }
        // Ensure that `payments` include `price`.
        if (total < _price) {
            Error("Sum of all payments can not be less than Property price.");
            return false;
        }


        for (uint8 i = 0; i < _payments.length; i++) {
            uint8 move = metaDeed.paymentMoves(i);
            require(move > 0);

            payments[move] = _payments[i];
            paymentMoves.push(move);
        }

        currentMoveIndex = 0;  // Explicit assignment, just in case.
        Initiated(total);
        return true;
    }

    function assignPayment(
        uint8 _paymentMove,
        uint8 _unlockAt,
        address _receiver,
        address _returnTo
    )
        public
        only(deed)
    returns(bool) {
        if (
            _paymentMove == 0 ||
            _unlockAt == 0 ||
            _receiver == address(0) ||
            _returnTo == address(0) ||
            withdrawals[_paymentMove].unlockAt != 0
        ) {
            return false;
        }

        withdrawals[_paymentMove] = Withdrawal(
            _unlockAt,
            _receiver,
            _returnTo,
            false
        );
        PaymentAssigned(_paymentMove, _unlockAt, _receiver, _returnTo, payments[_paymentMove]);
        return true;
    }

    function _checkPayment(address _sender, uint256 _value) internal {
        require(_value > 0);
        require(currentMoveIndex < paymentMoves.length);

        uint8 move = paymentMoves[currentMoveIndex];
        uint256 payment = payments[move];
        require(_value >= payment);
        PaymentReceived(move, _sender, _value);

        uint8 MOVE_STATUS_SUCCESS = 1;
        _notifyDeed(move, MOVE_STATUS_SUCCESS);
        currentMoveIndex += 1;
    }

    function _notifyDeed(uint8 _move, uint8 _MOVE_STATUS) internal {
        bytes32[] memory empty;
        assert(deed.action(_move, empty, empty, _MOVE_STATUS));
    }

    function reassignReceiver(uint8 _paymentMove, bool _onlyPending) public only(deed) returns(bool) {
        // TODO
    }

    function withdraw(uint8 _move) public returns(bool) {
        if (payments[_move] == 0) {
            Error("No such payment.");
            return false;
        }

        Withdrawal storage withdrawal = withdrawals[_move];
        if (withdrawal.done) {
            Error("Already withdrawn.");
            return false;
        }

        uint8 moveStatus = _paymentStatus(_move, withdrawal);
        address sendTo;
        if (moveStatus == uint8(MoveStatus.SUCCESS)) {
            sendTo = withdrawal.receiver;
        } else if (moveStatus == uint8(MoveStatus.FAILED)) {
            sendTo = withdrawal.returnTo;
        } else {
            return false;  // Move is not done yet
        }

        withdrawal.done = true;
        if (_withdraw(sendTo, payments[_move])) {
            PaymentWithdrawn(_move, sendTo, payments[_move]);
            return true;
        }
        revert();
    }

    function _paymentStatus(uint8 _move, Withdrawal _withdrawal) internal returns(uint8) {
        uint8 unlockAt = _withdrawal.unlockAt;
        uint8 status;
        // Check whole chain of moves from payment to unlocking move
        for (uint8 i = _move; i <= unlockAt; i++) {
            status = deed.moves(i);
            // If some of the moves failed, return FAILED status
            if (status == 2) {
                return status;
            }
        }
        // Otherwise return status of the last move, so it will be either NOT_SET or SUCCESS
        return status;
    }

    // FIXME
    function _withdraw(address _receiver, uint256 _value) internal returns(bool) {
        return false;  // Implement escrow-dependent logic here
    }


}
