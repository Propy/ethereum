pragma solidity ^0.4.18;

import "../base/Owned.sol";
import "../disposable/BaseDeed.sol";
import "./BaseFactory.sol";


contract BaseDeedFactory is Owned, BaseFactory {
    function deployContract(address _metaDeed) public onlyContractOwner returns(address) {
        address created;
        created = new BaseDeed(_metaDeed);
        Contract(created);
        return created;
    }
}
