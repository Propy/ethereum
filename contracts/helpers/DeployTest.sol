pragma solidity 0.4.24;

import "../base/Owned.sol";

contract DeployTest is Owned {

    uint public invested;

    function invest() public payable returns(bool) {
        if (msg.value == 0) {
            return false;
        }
        invested += msg.value;
        return true;
    }

    function () public payable {
        invest();
    }

    function withdraw() public onlyContractOwner returns(bool) {
        msg.sender.transfer(this.balance);
        return true;
    }

}
