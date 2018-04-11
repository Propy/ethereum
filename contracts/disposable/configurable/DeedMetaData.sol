pragma solidity 0.4.21;

import "../../base/Owned.sol";

contract DeedMetaData is Owned {

    struct MoveInfo {
        bytes32 title;
    }

    uint256 constant ESCROW_ROLE =              0x2;
    uint256 constant BROKER_ROLE =              0x4;
    uint256 constant NOTARY_ROLE =              0x8;
    uint256 constant TITLE_COMPANY_AGENT_ROLE = 0x10;
    uint256 constant USER_ROLE =                0x80;

    address public controller;

}