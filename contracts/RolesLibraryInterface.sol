pragma solidity 0.5.8;

contract RolesLibraryInterface {
    function canCall(address, address, bytes4) public view returns(bool);
}
