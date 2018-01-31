pragma solidity 0.4.18;

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

    DeedInterface public oldDeed = DeedInterface(0x7cDce8f97AFf2F38a9C6A6c9f139998f7A79fA43);

    // PROPERTY //
    function property() public constant returns(address) {
        return oldDeed.propertyId();
    }
    function price() public constant returns(uint256) {
        return oldDeed.price();
    }
    function seller() public constant returns(address) {
        return oldDeed.selledId();
    }
    function buyer() public constant returns(address) {
        return oldDeed.buyerId();
    }
    function escrow() public constant returns(address) {
        return address(0);
    }
    function status() public constant returns(uint8) {
        return 1;
    }
    function moves(uint8) public constant returns(uint8) {
        return 1;
    }
    function intermediaries(uint256 _index) public constant returns(address) {
        return [
            oldDeed.brokerId(),                 // System
            oldDeed.agentId()                   // Notary
        ][_index];
    }
    function metaDeed() public constant returns(address) {
        return 0xd4BC1c1e570DbC529FDd6c1285cD6Df2c0620E5d;
    }

    function DeedWrapper(address _oldDeed) {
        oldDeed = DeedInterface(_oldDeed);
    }

}