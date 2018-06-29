pragma solidity 0.4.24;

import "./EscrowBase.sol";


contract EscrowEtherI is EscrowBase {

    function EscrowEtherI(address _metaDeed, address _deed) EscrowBase(_metaDeed, _deed) {}

    // NOTE: Insist on increasing gas limit when sending ether here.
    function() public payable {
        _checkPayment(msg.sender, msg.value);
    }

    function _withdraw(address _receiver, uint256 _value) internal returns(bool) {
        _receiver.transfer(_value);
        return true;
    }


}
