pragma solidity 0.4.24;


contract RolesLibraryInterface {
    function canCall(address, address, bytes4) public constant returns(bool);
}

contract RolesLibraryAdapter {
    RolesLibraryInterface rolesLibrary;

    event Unauthorized(address user);

    modifier auth() {
        if (!_isAuthorized(msg.sender, msg.sig)) {
            emit Unauthorized(msg.sender);
            return;
        }
        _;
    }

    constructor(address _rolesLibrary) public {
        rolesLibrary = RolesLibraryInterface(_rolesLibrary);
    }

    function setRolesLibrary(RolesLibraryInterface _rolesLibrary) auth() public returns(bool) {
        rolesLibrary = _rolesLibrary;
        return true;
    }

    function _isAuthorized(address _src, bytes4 _sig) internal returns(bool) {
        if (_src == address(this)) {
            return true;
        }
        if (address(rolesLibrary) == 0) {
            return false;
        }
        return rolesLibrary.canCall(_src, this, _sig);
    }
}
