pragma solidity ^0.4.11;

import "./SafeMath.sol";

contract ComissionCalc {
  using SafeMath for uint256;
  uint256 constComission;

  function ComissionCalc(uint256 _constComission){
    constComission=_constComission;
  }

  function getCompanyComission(uint256 price) returns (uint256){
      return constComission.div(3);
  }

  function getNetworkGrowthComission(uint256 price) returns (uint256){
      return constComission.div(3).mul(2);
  }

}
