pragma solidity 0.4.24;

import "./EscrowBase.sol";


contract EscrowOracle is EscrowBase {

    address oracle;
    uint256 public depositAmount;

    event Deposit(uint256 payment, uint256 sum);

    constructor(address _metaDeed, address _deed, address _oracle) EscrowBase(_metaDeed, _deed) public {
        oracle = _oracle;
    }

    function setOracle(address _oracle) onlyContractOwner public returns(bool) {
        oracle = _oracle;
        return true;
    }

    function deposit(uint _payment) only(oracle) public {
        depositAmount = depositAmount + _payment;
        emit Deposit(_payment, depositAmount);
        if (depositAmount > deed.price()) {
            _checkPayment(msg.sender, depositAmount);
        }
    }

    function _withdraw(address _payer, uint256 _payment) only(oracle) internal returns(bool) {
        return true;
    }

}
