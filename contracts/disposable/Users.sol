pragma solidity ^0.4.10;

import "../base/Owned.sol";

contract Users is Owned {

  enum Role { none, Person, Broker, EscrowAgent, Inspector, Admin }

  struct User {
    string firstname;
    string lastname;
    // address signature;
    string details;
    // bool verified;
    Role role;
    address wallet;
  }

  mapping (address => User) users;

  address public propyContractAddress;

  modifier allowedWriters() {
    if (contractOwner == msg.sender || propyContractAddress == msg.sender) _;
  }

  function setPropy(address propy) onlyContractOwner() {
    propyContractAddress=propy;
  }

  // Create & Update user
  function set(address _addr, string _firstname, string _lastname,string _details, uint _role, address _wallet) allowedWriters() returns (bool success) {
    users[_addr] = User(_firstname, _lastname,_details, Role(_role), _wallet);
    return true;
  }

  // Get user
  function get() constant returns (string, string, Role, address) {
    require (users[msg.sender].role != Role.none);
    return (
      users[msg.sender].firstname,
      users[msg.sender].lastname,
      users[msg.sender].role,
      users[msg.sender].wallet
    );
  }

  function getOther(address _addr) constant returns (string, string, Role, address) {
    require (users[_addr].role != Role.none);
    return (
      users[_addr].firstname,
      users[_addr].lastname,
      users[_addr].role,
      users[_addr].wallet
    );
  }

  function getWallet(address _addr) constant returns (address) {
    require (users[_addr].role != Role.none);
    return (
      users[_addr].wallet
    );
  }

  function getRole(address _addr) constant returns (Role) {
    require (users[_addr].role != Role.none);
    return (
      users[_addr].role
    );
  }

  // Revome user
  function remove(address _addr) allowedWriters() {
    delete users[_addr];
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