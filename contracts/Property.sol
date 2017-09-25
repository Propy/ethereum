pragma solidity ^0.4.10;

import "./Owned.sol";

contract Property is Owned {

  enum Status { approved, pending }

  address public titleOwnerId; //sellerId

  string public name;
  string public physAddr;
  string public description;
  string public url;
  string public meta;
  uint public area;

   // pending status ownership owner
  address public pendingStatusOwnerDeed;
  Status public status;

  //This event is called when the Property Owner is updated for updating DApp UI
  event PropertyOwnerChanged(address _propertyAddress, address _ownerAddress);
  event PropertyStatusChanged(address _propertyAddress, Status _status);

  // ---------------------------------------------------------------------------
  // Constuctor
  // For defining basic property metadata
  function Property(address _titleOwnerId, string _name, string _physAddr, uint _area) {
    titleOwnerId = _titleOwnerId;
    name = _name;
    physAddr = _physAddr;
    area = _area;
    status = Status.approved;
  }

  function setPropertyToPendingState(address _pendingStatusOwnerDeed) onlyContractOwner() returns (bool){
      require(status == Status.approved);
      status = Status.pending;
      pendingStatusOwnerDeed=_pendingStatusOwnerDeed;
      PropertyStatusChanged(address(this), status);
      return true;
  }

  // ---------------------------------------------------------------------------
  // Update property
  //
  function set(string _url) {
    // validate ownerId of property before any changes can be made
    require (titleOwnerId == msg.sender);
    url = _url;
  }

  // ---------------------------------------------------------------------------
  // Get ownerId
  function getowner() constant returns (address) {
    return titleOwnerId;
  }

  // ---------------------------------------------------------------------------
  // Change Owner of Property
  function approveOwnershipTransfer(address _ownerId) {
      // Ensure that Property Status is in correct pending state
      require(msg.sender == pendingStatusOwnerDeed);
      require(status == Status.pending);
      titleOwnerId = _ownerId;
      status = Status.approved;
      pendingStatusOwnerDeed=0;
      PropertyOwnerChanged(address(this), _ownerId);
      PropertyStatusChanged(address(this), status);
  }

  // Change Owner of Property
  function rejectOwnershipTransfer() {
      // Ensure that Property Status is in correct pending state
      require(msg.sender == pendingStatusOwnerDeed);
      require(status == Status.pending);
      status = Status.approved;
      pendingStatusOwnerDeed=0;
      PropertyStatusChanged(address(this), status);
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
    revert();     // Prevents accidental sending of ether
  }

}
