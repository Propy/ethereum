pragma solidity 0.4.24;

import "./MetaDeed.sol";


contract MetaDeedUkraine is MetaDeed {

    enum MOVES {
        NONE,
        PURCHASE_AGREEMENT,
        PAYMENT,
        OWNERSHIP_TRANSFER
    }

    enum PARTIES {
        NONE,
        SELLER,
        BUYER,
        ESCROW,
        SYSTEM,
        NOTARY
    }

    constructor(address _controller) MetaDeed(_controller) public {
        uint NOTARY_ROLE = 8;
        require(roleExists(_controller, NOTARY_ROLE));

        intermediaries.push(uint(PARTIES.SYSTEM));
        intermediaries.push(uint(PARTIES.NOTARY));

        moves[uint8(MOVES.PURCHASE_AGREEMENT)].name = "Purchase Agreement";
        moves[uint8(MOVES.PURCHASE_AGREEMENT)].party = uint(PARTIES.SYSTEM);
        moves[uint8(MOVES.PURCHASE_AGREEMENT)].args = 1;
        // Don't check the role 'cause we don't need it for system user

        moves[uint8(MOVES.PAYMENT)].name = "Payment";
        moves[uint8(MOVES.PAYMENT)].party = uint(PARTIES.ESCROW);
        moves[uint8(MOVES.PAYMENT)].dependency = uint8(MOVES.PURCHASE_AGREEMENT);
        moves[uint8(MOVES.PAYMENT)].unlockPaymentAt = uint8(MOVES.OWNERSHIP_TRANSFER);
        moves[uint8(MOVES.PAYMENT)].receiver = uint(PARTIES.SELLER);
        moves[uint8(MOVES.PAYMENT)].returnTo = uint(PARTIES.BUYER);
        paymentMoves.push(uint8(MOVES.PAYMENT));

        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].name = "Ownership transfer";
        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].party = uint(PARTIES.NOTARY);
        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].role = NOTARY_ROLE;
        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].args = 2;
        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].dependency = uint8(MOVES.PAYMENT);
        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].isFinal = true;

        movesCount = 3;

    }

}
