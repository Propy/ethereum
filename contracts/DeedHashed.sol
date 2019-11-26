pragma solidity ^0.5.11;

import "./base/Owned.sol";

contract DeedHashed is Owned {

    // contains title document hash
    bytes32 public hash;
    // Contains hash of the deed parameters which are not included in the document.
    // Those parameters should be arranged in JSON with an appropriate JSON-schema.
    // Version of a schema contained in "getType" function
    bytes32 public metahash;

    function update(bytes32 _hash, bytes32 _metahash) public onlyContractOwner {
        hash = _hash;
        metahash = _metahash;
    }

    function getType() external pure returns(bytes32) {
        // hd - hashed deed. Number after the dot is a version of Metadata document schema
        return keccak256("hd.0");
    }
}
