pragma solidity ^0.4.10;

import "./Owned.sol";

contract Property is Owned {

  enum Status { registered, pending }

  address public ownerId; //sellerId

  Status public status;

  string public name;
  string public addr;
  string public description;
  string public url;
  string public meta;

  uint public price;

  uint public createdAt;
  uint public updatedAt;
  //This event is called when the Property Owner is updated for updating DApp UI
  event PropertyOwnerChanged(address ownerAddress);

  // ---------------------------------------------------------------------------
  // Constuctor
  // For defining basic property metadata
  function Property(address _ownerId, string _name) {
    ownerId = _ownerId;
    name = _name;
    createdAt = now;
    status = Status.registered;
  }

  // ---------------------------------------------------------------------------
  // Update property
  //
  function set(string _url) {
    // validate ownerId of property before any changes can be made
    if (ownerId != msg.sender) throw;
    url = _url;
    updatedAt = now;
  }

  // ---------------------------------------------------------------------------
  // Get ownerId
  function getowner() constant returns (address) {
    return ownerId;
  }

  // ---------------------------------------------------------------------------
  // Kill contract
  function setPendingTransfer() {
      status = Status.pending;
  }


  // ---------------------------------------------------------------------------
  // Change Owner of Property
  function setOwner(address _ownerId) {
      // Ensure that Property Status is in correct pending state
      if(status != Status.pending)
        throw;
      ownerId = _ownerId;
      updatedAt = now;
      status = Status.registered;
      PropertyOwnerChanged(_ownerId);
  }

  // ---------------------------------------------------------------------------
  // Kill contract
  function kill() onlyContractOwner() {
   if (msg.sender == contractOwner){
      suicide(contractOwner);
    }
  }

  // ---------------------------------------------------------------------------
  // This unnamed function is called whenever someone tries to send ether to it
  function () {
    throw;     // Prevents accidental sending of ether
  }

}
