pragma solidity ^0.4.10;

contract Owned {
  address public contractOwner;
  address public pendingContractOwner;

  function Owned() {
    contractOwner = msg.sender;
  }

  modifier onlyContractOwner() {
    if (contractOwner == msg.sender) _;
  }

  function changeContractOwnership(address _to) onlyContractOwner() returns(bool) {
    pendingContractOwner = _to;
    return true;
  }

  function claimContractOwnership() returns(bool) {
    if (pendingContractOwner != msg.sender)
      return false;
    contractOwner = pendingContractOwner;
    delete pendingContractOwner;
    return true;
  }
}