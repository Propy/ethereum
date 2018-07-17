pragma solidity 0.4.24;

import "../../base/Owned.sol";

contract BaseDocument is Owned {

    bytes32 public hash;
    string[] public tags;

    bool public finalized;

    modifier isNotFinalized() {
        require(!finalized, "Contract is finalized");
        _;
    }

    constructor(bytes32 _hash) public {
        hash = _hash;
    }

    function proxy_init(address _owner, bytes32 _hash) public {
        require(contractOwner == address(0));
        contractOwner = _owner;
        hash = _hash;
    }

    function setHash(bytes32 _hash) public isNotFinalized onlyContractOwner {
        hash = _hash;
    }

    function addTag(string _key) public isNotFinalized onlyContractOwner {
        require(tagsLength() < 32, "Tags is too many!");
        tags.push(_key);
    }

    function setFinalized() public isNotFinalized onlyContractOwner {
        finalized = true;
    }

    function tagsLength() public view returns(uint256) {
        return tags.length;
    }

    function documentType() public pure returns(bytes32) {
        return keccak256("basic");
    }

}
