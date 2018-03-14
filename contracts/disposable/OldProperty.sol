pragma solidity ^0.4.10;

import "../base/Owned.sol";

contract OldProperty is Owned {

  enum Status { approved, pending }

  address public titleOwnerId; //sellerId

  string public name = "test";
  string public physAddr = "address";
  string public description = "test desc";
  string public url = "http://example.com";
  string public meta = "WTF";
  uint public area = 1350;

   // pending status ownership owner
  address public pendingStatusOwnerDeed;
  Status public status = Status.approved;

  // ---------------------------------------------------------------------------
  // Get ownerId
  function getowner() constant returns (address) {
    return titleOwnerId;
  }

}