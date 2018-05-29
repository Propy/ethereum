pragma solidity 0.4.23;

import "../base/Owned.sol";

contract DeedInterface {
    function selledId() public constant returns(address);
    function buyerId() public constant returns(address);
    function brokerId() public constant returns(address);
    function agentId() public constant returns(address);
    function propertyId() public constant returns(address);
    function price() public constant returns(uint);
}


contract DeedWrapper is Owned {

    address public property;
    uint256 public price;
    address public seller;
    address public buyer;

    // PROPERTY //

    function escrow() public constant returns(address) {
        return address(0);
    }
    function status() public constant returns(uint8) {
        return 1;
    }
    function moves(uint8) public constant returns(uint8) {
        return 1;
    }
    function intermediaries(uint256) public constant returns(address) {
        return address(0);
    }
    function metaDeed() public constant returns(address) {
        return address(0);
    }

    function DeedWrapper(address _property, address _seller, address _buyer) public {
        property = _property;
        seller = _seller;
        buyer = _buyer;
    }

    function setPrice(uint256 _price) public onlyContractOwner {
        price = _price;
    }

}