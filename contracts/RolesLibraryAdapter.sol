pragma solidity 0.5.8;


contract RolesLibraryInterface {
    function canCall(address, address, bytes4) public view returns(bool);
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

    function _isAuthorized(address _src, bytes4 _sig) internal view returns(bool) {
        if (_src == address(this)) {
            return true;
        }
        if (address(rolesLibrary) == address(0)) {
            return false;
        }
        return rolesLibrary.canCall(_src, address(this), _sig);
    }
}

