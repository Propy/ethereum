pragma solidity 0.4.24;

import "./helpers/SafeMath.sol";
import "./base/Owned.sol";


contract DocumentFeeCalc is Owned {

    using SafeMath for uint256;

    uint256 baseFee;

    constructor(uint256 _baseFee) public {
        baseFee = _baseFee;
    }

    function getFee() public constant returns(uint256) {
        return baseFee;
    }

    function getCompanyFee() public view returns (uint256) {
        return getFee().div(3);
    }

    function getNetworkGrowthFee() public view returns (uint256) {
        return getFee().sub(getCompanyFee());
    }

    function setFee(uint256 _baseFee) public onlyContractOwner {
        baseFee = _baseFee;
    }

}
