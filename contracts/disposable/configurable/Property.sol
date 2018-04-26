pragma solidity 0.4.23;

import "../../base/Owned.sol";
import "../../base/AddressChecker.sol";

contract NewProperty is Owned, AddressChecker {
    enum Status {
        OWNED,
        PENDING,
        MIGRATED
    }

    enum AreaType {
        FEET,
        METERS
    }

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

    address[] public owners;
    mapping(address => uint8[2]) public part;

    modifier onlyStatus(Status _status) {
        if (status == _status) {
            _;
        }
    }

    modifier onlyTitleOwner() {
        for(uint256 i = 0; i < owners.length; ++i) {
            if(owners[i] == msg.sender) {
                _;
                break;
            }
        }
    }

    event OwnerChanged(address property, address[] owners);
    event StatusChanged(address property, uint8 to);
    event Migrated(address to);

    constructor (
        address _previousVersion,
        address[] _titleOwner,
        string _name,
        string _physicalAdress,
        string _url,
        uint _areaType,
        uint256 _area
    )
     public
    {
        previousVersion = _previousVersion;
        owners = _titleOwner;
        name = _name;
        physicalAdress = _physicalAdress;
        url = _url;
        areaType = AreaType(_areaType);
        area = _area;
        status = Status.OWNED;
    }

    function setUrl(string _url) public onlyTitleOwner returns(bool) {
        url = _url;
        return true;
    }

    function setPropertyToPendingState(address _deed)
     public
     onlyContractOwner
     onlyStatus(Status.OWNED)
     returns(bool)
    {
        status = Status.PENDING;
        currentDeed = _deed;
        emit StatusChanged(address(this), uint8(status));
        return true;
    }

    function approveOwnershipTransfer(address[] _newOwners, uint8[2][] _parts)
     public
     onlyStatus(Status.PENDING)
     only(currentDeed)
     returns(bool)
    {
        for (uint256 i = 0; i < _newOwners.length; ++i) {
            part[_newOwners[i]][0] = _parts[0][i];
            part[_newOwners[i]][1] = _parts[1][i];
            owners.push(_newOwners[i]);
        }
        status = Status.OWNED;
        currentDeed = address(0);
        emit OwnerChanged(address(this), _newOwners);
        emit StatusChanged(address(this), uint8(status));
        return true;
    }

    function rejectOwnershipTransfer()
     public
     onlyStatus(Status.PENDING)
     only(currentDeed)
     returns(bool)
    {
        status = Status.OWNED;
        currentDeed = address(0);
        emit StatusChanged(address(this), uint8(status));
    }

    function migrate(address _to) public onlyContractOwner returns(bool) {
        NewProperty newProperty = NewProperty(_to);
        if (newProperty.previousVersion() != address(this)) {
            return false;
        }
        newVersion = _to;
        status = Status.MIGRATED;
        emit Migrated(_to);
        return true;
    }
}