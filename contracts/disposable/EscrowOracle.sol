pragma solidity 0.4.23;

import "./EscrowBase.sol";


contract EscrowOracle is EscrowBase {

    address oracle;

    function EscrowOracle(address _metaDeed, address _deed, address _oracle) EscrowBase(_metaDeed, _deed) {
        oracle = _oracle;
    }

    function setOracle(address _oracle) onlyContractOwner public returns(bool) {
        oracle = _oracle;
        return true;
    }

    function deposit(uint _payment) only(oracle) public {
        _checkPayment(msg.sender, _payment);
    }

    function _withdraw(address _payer, uint256 _payment) only(oracle) internal returns(bool) {
        return true;
    }

}
