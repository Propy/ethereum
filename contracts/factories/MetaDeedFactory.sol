pragma solidity 0.4.18;

import "../base/Owned.sol";
import "../helpers/Aux.sol";
import "../disposable/MetaDeedCalifornia.sol";
import "../disposable/MetaDeedUkraine.sol";
import "./BaseFactory.sol";


contract MetaDeedFactory is Owned, Aux, BaseFactory {
    function deployContract(bytes32 _type, address _controller) public onlyContractOwner returns(address) {
        address created;
        if (_type == toBytes32("California")) {
            created = new MetaDeedCalifornia(_controller);
        } else if (_type == toBytes32("Ukraine")) {
            created = new MetaDeedUkraine(_controller);
        } else {
            revert();
        }
        Contract(created);
        return created;
    }
}
