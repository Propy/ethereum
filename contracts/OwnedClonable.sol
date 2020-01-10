pragma solidity 0.5.8;


contract OwnedClonable  {
    address public contractOwner;
    address public pendingContractOwner;

    event OwnershipChanged(address _to);
    event OwnershipChangeInitiated(address _to);

    // Prototype lock.
    constructor () public {
        construct(0x0000000000000000000000000000000000000001);
    }

    function construct(address _owner) public {
        require(contractOwner ==address(0));
        contractOwner = _owner;
    }

    function construct() public {
        construct(msg.sender);
    }

    modifier onlyContractOwner() {
        if (contractOwner == msg.sender) {
            _;
        }
    }

    function changeContractOwnership(address _to) public onlyContractOwner() returns(bool) {
        pendingContractOwner = _to;
        emit OwnershipChangeInitiated(_to);
        return true;
    }

    function claimContractOwnership() public returns(bool) {
        if (pendingContractOwner != msg.sender) {
            return false;
        }
        delete pendingContractOwner;
        _setContractOwner(msg.sender);
        return true;
    }

    function forceChangeContractOwnership(address _to) public onlyContractOwner() returns(bool) {
        _setContractOwner(_to);
        return true;
    }

    function _setContractOwner(address _to) internal {
        contractOwner = _to;
        emit OwnershipChanged(_to);
    }
}

