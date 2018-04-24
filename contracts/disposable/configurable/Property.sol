pragma solidity ^0.4.18;

import "../../base/Owned.sol";
import "../../base/AddressChecker.sol";

contract Property is Owned, AddressChecker {
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

    event OwnerChanged(address property, address[] owners);
    event StatusChanged(address property, uint8 to);
    event Migrated(address to);

    function Property(
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

    function setPropertyToPendingState(address _deed)
     public
     onlyContractOwner
     onlyStatus(Status.OWNED)
     returns(bool)
    {
        status = Status.PENDING;
        currentDeed = _deed;
        StatusChanged(address(this), uint8(status));
        return true;
    }

    function approveOwnershipTransfer(address[] _newOwners, uint8[2][] _parts)
     public
     onlyStatus(Status.PENDING)
     only(currentDeed)
     returns(bool)
    {
        owners = _newOwners;
        status = Status.OWNED;
        currentDeed = address(0);
        OwnerChanged(address(this), _newOwners);
        StatusChanged(address(this), uint8(status));
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
        StatusChanged(address(this), uint8(status));
    }
}