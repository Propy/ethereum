pragma solidity 0.5.8;

import "./AddressChecker.sol";
import "./Owned.sol";


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


    constructor(
        address _previousVersion,
        address _titleOwner,
        string memory _name,
        string memory _physicalAdress,
        uint _areaType,
        uint256 _area
    ) public {
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
        status = Status.PENDING;
        currentDeed = _deed;
        emit StatusChanged(address(this), uint8(status));
        return true;
    }


    function setUrl(string memory _url) public only(titleOwner) returns(bool) {
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
        emit OwnerChanged(address(this), _newOwner);
        emit StatusChanged(address(this), uint8(status));
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
        emit StatusChanged(address(this), uint8(status));
    }


    function migrate(address _to) public onlyContractOwner returns(bool) {
        Property newProperty = Property(_to);
        if (newProperty.getPreviousVersion() != address(this)) {
            return false;
        }
        newVersion = _to;
        status = Status.MIGRATED;
        emit Migrated(_to);
        return true;
    }


    /// GETTERS ///

    function getTitleOwner() public view returns(address) {
        return titleOwner;
    }

    function getPreviousVersion() public view returns(address) {
        return previousVersion;
    }

    function getNewVersion() public view returns(address) {
        return newVersion;
    }

}

