pragma solidity 0.4.24;

import "./BaseDocument.sol";

contract GrantDeedDocument is BaseDocument {

    address public deed;

    constructor(bytes32 _hash, address _deed) BaseDocument(_hash) {
        deed = _deed;
    }

    function documentType() public pure returns(bytes32) {
        return keccak256("grantdeed");
    }

    function setDeed(address _deed) public isNotFinalized onlyContractOwner {
        deed = _deed;
    }

}
