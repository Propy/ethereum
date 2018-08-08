pragma solidity 0.4.24;

import "./BaseDocument.sol";

contract GrantDeedDocument is BaseDocument {

    address public deed;
    address public agent;
    uint256 public deedDate;
    bytes32 public name;
    bytes32 public referenceNumber;

    constructor(bytes32 _hash, address _deed) public BaseDocument(_hash) {
        deed = _deed;
    }

    function documentType() public pure returns(bytes32) {
        return keccak256("grantdeed");
    }

    function setData(
        address _deed,
        address _agent,
        uint256 _date,
        bytes32 _name,
        bytes32 _ref
    ) public isNotFinalized onlyContractOwner {
        deed = _deed;
        agent = _agent;
        deedDate = _date;
        name = _name;
        referenceNumber = _ref;
    }

    function setDeed(address _deed) public isNotFinalized onlyContractOwner {
        deed = _deed;
    }

    function setAgent(address _agent) public isNotFinalized onlyContractOwner {
        agent = _agent;
    }

    function setDeedDate(uint256 _date) public isNotFinalized onlyContractOwner {
        deedDate = _date;
    }

    function setName(bytes32 _name) public isNotFinalized onlyContractOwner {
        name = _name;
    }

    function setReferenceNumber(bytes32 _ref) public isNotFinalized onlyContractOwner {
        referenceNumber = _ref;
    }

}
