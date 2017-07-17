pragma solidity ^0.4.10;

import "./Owned.sol";
import "./Users.sol";
import "./Deed.sol";
import "./Property.sol";

contract Propy is Owned {

  address public usersAddress;

  address brokerId;
  address agentId;

  //store arrays of necessary contracts
  address[] public deeds;
  address[] public properties;

  event LogSender(address log);
  event PropertyCreated(address propertyAddress);
  event DeedCreated(address propertyAddress);

  // ---------------------------------------------------------------------------
  // Constuctor
  function Propy() {
    usersAddress = new Users();
  }

  // ---------------------------------------------------------------------------
  // Users
  // For initiating and modifying global user data
  function setUser(address _addr, string _firstname, string _lastname, uint _role) onlyContractOwner() {
    Users users = Users(usersAddress);
    bool state = users.set(_addr, _firstname, _lastname, _role);
    if (_role == 2)
      brokerId = _addr;
    if (_role == 3)
      agentId = _addr;
    if (!state) throw;
  }


  // ---------------------------------------------------------------------------
  // Deeds

  function createDeed(address _propertyId) returns (address) {
    Property prop = Property(_propertyId);
    address selledId = prop.getowner();
    //intialize deed using property and user information
    address deed = new Deed(_propertyId, brokerId, msg.sender, agentId, selledId);
    //add deed to deeds array
    deeds.push(deed);
    //trigger event for UI
    DeedCreated(deed);
    return deed;
  }

  function setInspector(address _inspectorId, address _deed) onlyContractOwner() {
    Deed deed = Deed(_deed);
    //set third part property inspector metadata
    deed.setInspector(_inspectorId);
  }

  // ---------------------------------------------------------------------------
  // Property
  //
  function createProperty(string _name) returns (address) {
    address property = new Property(msg.sender, _name);
    //add new property to properties array
    properties.push(property);
    //trigger PropertyCreated event for UI
    PropertyCreated(property);
    return property;
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
