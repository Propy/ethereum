pragma solidity ^0.4.10;

import "./Owned.sol";
import "./Property.sol";

contract Deed is Owned {

  enum Status {
    reserve,
    sellerInvited,
    agentInvited,
    verifed,
    purchaseAgreement,
    payment,
    receivedPayment,
    titleDeed,
    closed
  }

  bool public invitedSeller;
  bool public invitedEscrowAgent;

  bool public buyerSigned;
  bool public sellerSigned;

  address public selledId;
  address public buyerId;
  address public brokerId;
  address public agentId;
  address public inspectorId;
  address public propertyId;

  Status public status;

  string public signed;
  string public submited;
  string public distributed;

  string public meta;
  string public metaPA;
  string public metaTD;

  uint public createdAt;
  uint public updatedAt;

  // ---------------------------------------------------------------------------
  // Constuctor
  // Initialize Deed metadata
  function Deed(address _propertyId, address _brokerId, address _buyerId, address _agentId, address _selledId) {
    propertyId = _propertyId;
    brokerId = _brokerId;
    buyerId = _buyerId;
    selledId = _selledId;
    agentId = _agentId;
    status = Status.reserve;
    createdAt = now;
  }

  // ---------------------------------------------------------------------------
  // Update deed
  // can only be updated by with valid agentId
  function deedSign(string _date) {
    if (agentId != msg.sender) throw;
    signed = _date;
  }
  function deedSubmit(string _date) {
    if (agentId != msg.sender) throw;
    submited = _date;
    Property prop = Property(propertyId);
    //updates the power of the property
    prop.setOwner(buyerId);
  }
  //update the distributed variable
  function deedDistribute(string _date) {
    if (agentId != msg.sender) throw;
    distributed = _date;
  }

  // create PA & TD
  function deedPA(string _pa) {
    if (agentId != msg.sender) throw;
    metaPA = _pa;
  }
  function deedmetaTD(string _td) {
    if (agentId != msg.sender) throw;
    metaTD = _td;
  }

  // sign PA
  function sign() returns (bool) {
    if (selledId == msg.sender)
      sellerSigned = true;
    if (buyerId == msg.sender)
      buyerSigned = true;
    if (sellerSigned && buyerSigned){
      status = Status.payment;
      Property prop = Property(propertyId);
      // set property transfer status to pending
      prop.setPendingTransfer();
    }
    updatedAt = now;
    return true;
  }

  function setStatus(uint _status) returns (bool) {
    if (agentId != msg.sender) throw;
    // if (_status < 0 || _status > 5) throw;
    Status _temp = Status(_status);
    if (_temp == Status.reserve) throw;
    if (_temp == Status.sellerInvited) throw;
    if (_temp == Status.agentInvited) throw;
    status = _temp;
    updatedAt = now;
    return true;
  }

  function sendInviteToSeller() returns (bool) {
    if (brokerId != msg.sender) throw;
        //update status to show that Seller invite is pending response
    status = Status.sellerInvited;
    updatedAt = now;
    return true;
  }

  function sendInviteToEscrowAgent() returns (bool) {
    if (brokerId != msg.sender) throw;
    //update status to show that Escrow Agent invite is pending response
    status = Status.agentInvited;
    updatedAt = now;
    return true;
  }

  function confirmSeller() returns (bool) {
    if (selledId != msg.sender) throw;
    //validate the Seller
    invitedSeller = true;
    updatedAt = now;
    return true;
  }

  function confirmEscrowAgent() returns (bool) {
    if (agentId != msg.sender) throw;
    //validate the Escrow Agent
    invitedEscrowAgent = true;
    updatedAt = now;
    return true;
  }

  function setInspector(address _inspectorId) onlyContractOwner() returns (bool) {
    inspectorId = _inspectorId;
    updatedAt = now;
    return true;
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

