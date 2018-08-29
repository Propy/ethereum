pragma solidity 0.4.24;

import './Escrow.sol';

contract EscrowBTC is Escrow {

    string public userWallet;
    string public systemWallet;
    uint256 public depositAmount;

    constructor (address _deed, string _wallet, string _systemWallet) public Escrow(_deed) {
        userWallet = _wallet;
        systemWallet = _systemWallet;
    }

    function btcReceive(string who, uint256 value, bytes32 transactionHash)
    external
    onlyContractOwner
    {
        require(!locked, "Escrow session is locked!");
        uint256 _value = value;
        require((depositAmount + _value) > depositAmount, "Wrong value!");
        depositAmount += _value;
        _receive(who, value, transactionHash);
    }

    function btcWithdraw(string to, uint256 value, bytes32 txHash)
    external
    onlyContractOwner
    {
        require(!locked, "Escrow session is locked!");
        require((depositAmount - value) < depositAmount, "Wrong value!");
        require(depositAmount >= value, "Contract hasn't need money!");
        depositAmount -= value;
        _withdraw(to, value, txHash);
    }

    function setUserWallet(string _userWallet) public onlyContractOwner {
        userWallet = _userWallet;
    }

    function getType() public pure returns(uint8) {
        return 4;
    }

    function currencyCode() public view returns(bytes4) {
        return bytes4("BTC");
    }

}
