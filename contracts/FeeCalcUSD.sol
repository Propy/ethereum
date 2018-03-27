pragma solidity 0.4.18;

import "./helpers/SafeMath.sol";
import "./base/Owned.sol";


// Updated for uses fee table associated with USD
contract FeeCalcUSD is Owned {

    uint256 constant UINT256_MAX = ~uint256(0);

    struct FeeValue {
        uint256 minPrice;
        uint256 maxPrice;
        uint256 fee;
    }

    using SafeMath for uint256;

    FeeValue[] feeValues;

    uint256 public baseFee;
    //uint8 servifeFeeDivider;

    function FeeCalcUSD(uint256 _baseFee) {
        baseFee = _baseFee;
        feeValues.push(FeeValue({minPrice: 1000, maxPrice: 10000, fee: 100000000}));
        feeValues.push(FeeValue({minPrice: 10001, maxPrice: 50000, fee: 1000000000}));
        feeValues.push(FeeValue({minPrice: 50001, maxPrice: 500000, fee: 10000000000}));
        feeValues.push(FeeValue({minPrice: 500001, maxPrice: 2000000, fee: 20000000000}));
        feeValues.push(FeeValue({minPrice: 2000001, maxPrice: 5000000, fee: 40000000000}));
        feeValues.push(FeeValue({minPrice: 5000001, maxPrice: 10000000, fee: 100000000000}));
        feeValues.push(FeeValue({minPrice: 10000001, maxPrice: UINT256_MAX, fee: 200000000000}));
    }

    function getFee(uint256 _price) public constant returns(uint256) {
        uint256 currentFee = baseFee;
        for (uint i = 0; i < feeValues.length; ++i) {
            if (_price >= feeValues[i].minPrice && _price <= feeValues[i].maxPrice) {
                currentFee = feeValues[i].fee;
            }
        }
        return currentFee;
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

}
