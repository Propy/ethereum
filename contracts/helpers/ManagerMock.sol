pragma solidity 0.4.24;

contract ManagerMock {
    bool denied;

    function deny() public {
        denied = true;
    }

    function isAllowed(address _actor, bytes32 _role) public returns(bool) {
        if (denied) {
            denied = false;
            return false;
        }
        return true;
    }
}
