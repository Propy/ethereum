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

    address public titleOwner;

    string public name;
    string public physicalAdress;
    string public description;
    string public url;
    string public meta;
    uint256 public area;  // Area type x100, for precicion

    address public currentDeed;
    uint8 public areaType;

    function status() public constant returns(uint8) {
        return 1;
    }
    function previousVersion() public constant returns(address) {
        return address(0);
    }
    function newVersion() public constant returns(address) {
        return address(0);
    }

    function init(
        address _titleOwner,
        string _name,
        string _description,
        string _physicalAdress,
        uint8 _areaType,
        uint256 _area,
        string _meta,
        string _url
    ) public onlyContractOwner {
        titleOwner = _titleOwner;
        name = _name;
        description = _description;
        physicalAdress = _physicalAdress;
        areaType = _areaType;
        area = _area;
        meta = _meta;
        url = _url;
    }

    function setDeed(address _deed) public onlyContractOwner {
        currentDeed = _deed;
    }

    /// GETTERS ///

    function getTitleOwner() public constant returns(address) {
        return titleOwner;
    }

    function getPreviousVersion() public constant returns(address) {
        return previousVersion();
    }

    function getNewVersion() public constant returns(address) {
        return newVersion();
    }

}