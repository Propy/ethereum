pragma solidity 0.4.18;

import "../base/AddressChecker.sol";
import "../base/Owned.sol";


contract Property is Owned, AddressChecker {

    enum Status { OWNED, PENDING, MIGRATED }
    enum AreaType { FEET, METERS }

    address public titleOwner;

    string public name;
    string public physicalAdress;
    string public description;
    string public url;
    string public meta;
    uint256 public area;  // Area type x100, for precicion

    address public currentDeed;
    Status public status;
    AreaType public areaType;

    address public previousVersion;
    address public newVersion;


    /// MODIFIERS ///

    modifier onlyStatus(Status _status) {
        if (status == _status) {
            _;
        }
    }


    /// EVENTS ///

    event OwnerChanged(address property, address owner);
    event StatusChanged(address property, uint8 to);
    event Migrated(address to);


    function Property(
        address _previousVersion,
        address _titleOwner,
        string _name,
        string _physicalAdress,
        uint _areaType,
        uint256 _area
    ) {
        previousVersion = _previousVersion;
        titleOwner = _titleOwner;
        name = _name;
        physicalAdress = _physicalAdress;
        areaType = AreaType(_areaType);
        area = _area;
        status = Status.OWNED;
    }


    function setPropertyToPendingState(address _deed)
        public
        onlyContractOwner
        onlyStatus(Status.OWNED)
    returns(bool) {
        return true;
        status = Status.PENDING;
        currentDeed = _deed;
        StatusChanged(address(this), uint8(status));
        return true;
    }


    function setUrl(string _url) public only(titleOwner) returns(bool) {
        url = _url;
        return true;
    }


    // FIXME
    function approveOwnershipTransfer(address _newOwner)
        public
        onlyStatus(Status.PENDING)
        only(currentDeed)
    returns(bool) {
        titleOwner = _newOwner;
        status = Status.OWNED;
        currentDeed = address(0);
        OwnerChanged(address(this), _newOwner);
        StatusChanged(address(this), uint8(status));
        return true;
    }


    // FIXME
    function rejectOwnershipTransfer()
        public
        onlyStatus(Status.PENDING)
        only(currentDeed)
    returns(bool) {
        status = Status.OWNED;
        currentDeed = address(0);
        StatusChanged(address(this), uint8(status));
    }


    function migrate(address _to) public onlyContractOwner returns(bool) {
        Property newProperty = Property(_to);
        if (newProperty.getPreviousVersion() != address(this)) {
            return false;
        }
        newVersion = _to;
        status = Status.MIGRATED;
        Migrated(_to);
        return true;
    }


    /// GETTERS ///

    function getTitleOwner() public constant returns(address) {
        return titleOwner;
    }

    function getPreviousVersion() public constant returns(address) {
        return previousVersion;
    }

    function getNewVersion() public constant returns(address) {
        return newVersion;
    }

}
