pragma solidity 0.4.18;

import "./MetaDeed.sol";


contract MetaDeedCalifornia is MetaDeed {

    enum MOVES {
        NONE,
        PURCHASE_AGREEMENT,
        TITLE_REPORT,
        SELLER_DISCLOSURES,
        PAYMENT,
        AFFIDAVIT,
        OWNERSHIP_TRANSFER
    }

    enum PARTIES {
        NONE,
        SELLER,
        BUYER,
        ESCROW,

        BROKER_SELLER,
        BROKER_BUYER,
        NOTARY,
        TITLE_COMPANY_AGENT
    }

    function MetaDeedCalifornia(address _controller) MetaDeed(_controller) {
        // Following roles must exist at UsersRegistry
        uint BROKER_ROLE = 4;
        require(roleExists(_controller, BROKER_ROLE));
        uint NOTARY_ROLE = 8;
        require(roleExists(_controller, NOTARY_ROLE));
        uint TITLE_COMPANY_AGENT_ROLE = 16;
        require(roleExists(_controller, TITLE_COMPANY_AGENT_ROLE));

        intermediaries.push(uint(PARTIES.BROKER_SELLER));
        intermediaries.push(uint(PARTIES.BROKER_BUYER));
        intermediaries.push(uint(PARTIES.NOTARY));
        intermediaries.push(uint(PARTIES.TITLE_COMPANY_AGENT));

        // Move 1. Purshase Agreement.
        // Required signatures offchain: BUYER, SELLER, BROKER_BUYER, BROKER_SELLER.
        // Document hash must be provided by BROKER_SELLER.
        moves[uint8(MOVES.PURCHASE_AGREEMENT)].name = "Purchase Agreement";
        moves[uint8(MOVES.PURCHASE_AGREEMENT)].party = uint(PARTIES.BROKER_SELLER);
        moves[uint8(MOVES.PURCHASE_AGREEMENT)].role = BROKER_ROLE;
        // Number of documents hashes to specify as an argument:
        moves[uint8(MOVES.PURCHASE_AGREEMENT)].args = 1;

        // Move 2. Title Report. Uploaded by a title company.
        // Required signatures offchain: BUYER, SELLER.
        // Document hash must be provided by SELLER.
        moves[uint8(MOVES.TITLE_REPORT)].name = "Title Report";
        moves[uint8(MOVES.TITLE_REPORT)].party = uint(PARTIES.SELLER);
        moves[uint8(MOVES.TITLE_REPORT)].dependency = uint8(MOVES.PURCHASE_AGREEMENT);
        moves[uint8(MOVES.TITLE_REPORT)].args = 1;

        // Move 3. Seller Disclosures.
        // Required signatures offchain: SELLER, BUYER, BROKER_SELLER.
        // Document hash must be provided by BROKER_SELLER.
        moves[uint8(MOVES.SELLER_DISCLOSURES)].name = "Seller Disclosures";
        moves[uint8(MOVES.SELLER_DISCLOSURES)].party = uint(PARTIES.BROKER_SELLER);
        moves[uint8(MOVES.SELLER_DISCLOSURES)].role = BROKER_ROLE;
        moves[uint8(MOVES.SELLER_DISCLOSURES)].dependency = uint8(MOVES.TITLE_REPORT);
        moves[uint8(MOVES.SELLER_DISCLOSURES)].args = 1;

        // Move 4. Payment.
        moves[uint8(MOVES.PAYMENT)].name = "Payment";
        moves[uint8(MOVES.PAYMENT)].party = uint(PARTIES.ESCROW);
        moves[uint8(MOVES.PAYMENT)].dependency = uint8(MOVES.SELLER_DISCLOSURES);
        moves[uint8(MOVES.PAYMENT)].unlockPaymentAt = uint8(MOVES.OWNERSHIP_TRANSFER);
        moves[uint8(MOVES.PAYMENT)].receiver = uint(PARTIES.SELLER);
        moves[uint8(MOVES.PAYMENT)].returnTo = uint(PARTIES.BUYER);
        paymentMoves.push(uint8(MOVES.PAYMENT));

        // Move 5. Affidavit.
        // Required signatures offchain: BUYER, SELLER.
        // Document hash must be provided by SELLER.
        moves[uint8(MOVES.AFFIDAVIT)].name = "Affidavit";
        moves[uint8(MOVES.AFFIDAVIT)].party = uint(PARTIES.SELLER);
        moves[uint8(MOVES.AFFIDAVIT)].dependency = uint8(MOVES.PAYMENT);
        moves[uint8(MOVES.AFFIDAVIT)].args = 1;

        // Move 6. Ownership transfer approval or rejection.
        // Local registry office notifies the title company that the deed
        // has been recorded. Move is done by TITLE_COMPANY_AGENT.
        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].name = "Ownership transfer";
        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].party = uint(PARTIES.TITLE_COMPANY_AGENT);
        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].role = TITLE_COMPANY_AGENT_ROLE;
        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].args = 1;
        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].dependency = uint8(MOVES.AFFIDAVIT);
        moves[uint8(MOVES.OWNERSHIP_TRANSFER)].isFinal = true;

        movesCount = 6;

    }

}
