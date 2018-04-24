pragma solidity 0.4.23;


import "./StandardToken.sol";
import "../base/Owned.sol";

/**

 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `StandardToken` functions.
 */
contract RBCToken is StandardToken, Owned {

  string public name = "PropyKindaToken";
  string public symbol = "PKT";
  uint public decimals = 8;
  uint public INITIAL_SUPPLY = 100000000 * 100000000;

  /**
   * @dev Contructor that gives msg.sender all of existing tokens.
   */
  function RBCToken() {
    totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }

}
