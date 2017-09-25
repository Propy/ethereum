pragma solidity ^0.4.10;

import "./Owned.sol";
import "./Users.sol";
import "./Deed.sol";
import "./Property.sol";
import "./ERC20.sol";
import "./ComissionCalc.sol";
import "./PropertyManager.sol";

contract Propy is Owned, PropertyManager {

  address public usersRegistry;

  //store arrays of necessary contracts
  //address[] public deeds;
  address[] public propertyRegistry;
  address[] public deeds;
  mapping (address => bool) existingDeeds;

  address public propyToken;
  address public comissionCalc;

  address propyCompanyWallet;
  address propyNetworkGrowthPoolWallet;

  event LogSender(address log);
  event PropertyCreated(address propertyAddress);
  event DeedCreated(address deedAddress);

  // ---------------------------------------------------------------------------
  // Constuctor
  function Propy(address tokenAddress) {
    propyToken=tokenAddress;
  }

  function setComissionCalc(address _comissionCalc) onlyContractOwner(){
    comissionCalc=_comissionCalc;
  }

  function setUsers(address _usersRegistry) onlyContractOwner(){
    usersRegistry=_usersRegistry;
  }

  function setComissionWallets(address _propyCompanyWallet, address _propyNetworkGrowthPoolWallet) onlyContractOwner() {
    propyCompanyWallet=_propyCompanyWallet;
    propyNetworkGrowthPoolWallet=_propyNetworkGrowthPoolWallet;
  }





  // ---------------------------------------------------------------------------
  // Users
  // For initiating and modifying global user data
  function setUser(address _addr, string _firstname, string _lastname,string _details, uint _role, address _wallet) onlyContractOwner() {
    Users users = Users(usersRegistry);
    bool state = users.set(_addr, _firstname, _lastname,_details, _role, _wallet);
    if (!state) revert();
  }


  // ---------------------------------------------------------------------------
  // Deeds

  function createDeed(address _propertyId, address _buyeId, address _escrowID, address _brokerID,  uint _price)  onlyContractOwner() returns (address) {
    Property prop = Property(_propertyId);
    address selledId = prop.getowner();

    Users users = Users(usersRegistry);
    address seller_wallet=users.getWallet(selledId);
    address buyer_wallet=users.getWallet(_buyeId);
    assert (seller_wallet>0);
    assert (buyer_wallet>0);

    require (users.getRole(_escrowID) == Users.Role.EscrowAgent);
    require (users.getRole(_brokerID) == Users.Role.Broker);

    //intialize deed using property and user information
    address deed = new Deed(_propertyId, _brokerID, _buyeId,buyer_wallet, _escrowID,
       selledId, seller_wallet, _price, propyToken, comissionCalc, propyCompanyWallet,
        propyNetworkGrowthPoolWallet, msg.sender);
    deeds.push(deed);
    existingDeeds[deed]=true;
    //add deed to deeds array
    //trigger event for UI
    DeedCreated(deed);
    return deed;
  }

  function setPropertyToPendingState(address propertyAddress) returns (bool) {
    require (existingDeeds[msg.sender]);
    Property p = Property(propertyAddress);
    return p.setPropertyToPendingState(msg.sender);
  }

  /*function setInspector(address _inspectorId, address _deed) onlyContractOwner() {
    Deed deed = Deed(_deed);
    //set third part property inspector metadata
    deed.setInspector(_inspectorId);
  }*/

  // ---------------------------------------------------------------------------
  // Property
  //
  function createProperty(address _owner, string _name, string _physAddr, uint _area) onlyContractOwner() returns (address) {
    address property = new Property(_owner, _name,_physAddr,_area);
    //add new property to properties array
    propertyRegistry.push(property);
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
    revert();     // Prevents accidental sending of ether
  }

}
