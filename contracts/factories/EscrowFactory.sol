pragma solidity 0.4.18;

import "../base/Owned.sol";
import "../helpers/Aux.sol";
import "../disposable/EscrowEther.sol";
import "./BaseFactory.sol";


contract EscrowFactory is Owned, Aux, BaseFactory  {
    function deployContract(bytes32 _type, address _metaDeed, address _baseDeed) public onlyContractOwner returns(address) {
        address created;
        if (_type == toBytes32("Ether")) {
            created = new EscrowEther(_metaDeed, _baseDeed);
        } else {
            revert();
        }
        Contract(created);
        return created;
    }
}
