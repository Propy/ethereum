pragma solidity 0.4.24;

import "./helpers/SafeMath.sol";
import "./base/Owned.sol";


contract FeeCalc is Owned {

    using SafeMath for uint256;

    uint256 baseFee;  // FIXME
    //uint8 servifeFeeDivider;

    function FeeCalc(uint256 _baseFee) {
        baseFee = _baseFee;  // FIXME
        //servifeFeeDivider = 5;  // FIXME
    }

    //

    function getFee(uint256 _price) public constant returns(uint256) {
        return baseFee;  // FIXME
    }

    function getCompanyFee(uint256 _price) public constant returns (uint256) {
        return getFee(_price).div(3);
    }

    function getNetworkGrowthFee(uint256 _price) public constant returns (uint256) {
        return getFee(_price).sub(getCompanyFee(_price));
    }

    function setFee(uint256 _baseFee) public onlyContractOwner {
        baseFee = _baseFee;
    }

    // Minimum fee charged in case of ownership transfer reject
    /*function serviceFee(uint256 _price) public constant returns(uint256) {
        return getFee(_price).div(servifeFeeDivider);
    }*/

}
