pragma solidity 0.4.18;
import "../base/AddressChecker.sol";
import "../base/Owned.sol";

contract PropertyInterface {
    function name() public constant returns(string);
    function physAddr() public constant returns(string);
    function description() public constant returns(string);
    function url() public constant returns(string);
    function meta() public constant returns(string);
    function area() public constant returns(uint);
    function titleOwnerId() public constant returns(address);
    function status() public constant returns(uint8);
}

contract PropertyWrapper is Owned, AddressChecker {

    PropertyInterface public oldProperty = PropertyInterface(0x00);

    function titleOwner() public constant returns(address) {
        return oldProperty.titleOwnerId();
    }
    function area() public constant returns(uint256) {
        return oldProperty.area();
    }
    function currentDeed() public constant returns(address) {
        return 0;
    }
    function status() public constant returns(uint8) {
        return oldProperty.status();
    }
    function areaType() public constant returns(uint8) {
        return 1;
    }
    function previousVersion() public constant returns(address) {
        return oldProperty;
    }
    function newVersion() public constant returns(address) {
        return address(0);
    }
    function url() public constant returns(string) {
        return "";
    }
    function description() public constant returns(string) {
        return "";
    }
    function meta() public constant returns(string) {
        return "";
    }

    string public name;
    string public physicalAddress;

    function PropertyWrapper(
        address _oldProperty,
        string _name,
        string _physicalAddress
    ) 
    public 
    {
        oldProperty = PropertyInterface(_oldProperty);
        name = _name;
        physicalAddress = _physicalAddress;
    }

    /// GETTERS ///

    function getTitleOwner() public constant returns(address) {
        return titleOwner();
    }

    function getPreviousVersion() public constant returns(address) {
        return previousVersion();
    }

    function getNewVersion() public constant returns(address) {
        return newVersion();
    }

}