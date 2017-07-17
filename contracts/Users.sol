pragma solidity ^0.4.10;

import "./Owned.sol";

contract Users is Owned {

  enum Role { none, Person, Broker, EscrowAgent, Inspector, Admin }

  struct User {
    string firstname;
    string lastname;
    // address signature;
    // bool verified;
    Role role;
  }

  mapping (address => User) users;

  // Create & Update user
  function set(address _addr, string _firstname, string _lastname, uint _role) onlyContractOwner() returns (bool success) {
    users[_addr] = User(_firstname, _lastname, Role(_role));
    return true;
  }

  // Get user
  function get() constant returns (string, string, Role) {
    if (users[msg.sender].role == Role.none) throw;
    return (
      users[msg.sender].firstname,
      users[msg.sender].lastname,
      users[msg.sender].role
    );
  }

  function getOther(address _addr) constant returns (string, string, Role) {
    if (users[_addr].role == Role.none) throw;
    return (
      users[_addr].firstname,
      users[_addr].lastname,
      users[_addr].role
    );
  }

  // Revome user
  function remove(address _addr) onlyContractOwner() {
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
    throw;     // Prevents accidental sending of ether
  }
}
