pragma solidity 0.4.21;

import "../../base/Owned.sol";
import "../../base/AddressChecker.sol";

pragma experimental "v0.5.0"; // Include 0.5.0 features !

contract MetaDataInterface {
    function controller() public constant returns(address);
    function getMoveInfo() public constant returns(bytes32);
}

contract ControllerInterface {
    function feeCalc() public constant returns(address);
    function token() public constant returns(address);
    function usersRegistry() public constant returns(address);

    function companyWallet() public constant returns(address);
    function networkGrowthPoolWallet() public constant returns(address);
}

contract UsersRegistryInterface {
    function hasRole(address, uint) public constant returns(bool);
    function getUserRole(address) public constant returns(uint);
    function getWallet(address) public constant returns(address);
}

contract TokenInterface {
    function balanceOf(address) public constant returns(uint256);
    function transferFrom(address, address, uint256) public returns(bool);
    function allowance(address owner, address spender) public constant returns (uint256);
}

contract FeeCalcInterface {
    function getFee(uint256) public constant returns(uint256);
    function getCompanyFee(uint256) public constant returns(uint256);
    function getNetworkGrowthFee(uint256) public constant returns(uint256);
}

contract EscrowInterface {
    function init(uint256, uint256[]) public returns(bool);
    function assignPayment(uint8, uint8, address, address) public returns(bool);
}

contract PropertyInterface {
    function approveOwnershipTransfer(address) public returns(bool);
    function rejectOwnershipTransfer() public returns(bool);
}

contract Deed is Owned, AddressChecker {

    enum DeedStatus {
        NONE,
        PREPARED,
        RESERVED,
        FINISHED,
        REJECTED
    }

    struct Sign {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct StepInfo {
        uint16 moveId;
        uint256 requiredRoles;
        byte flag;
    }

    struct StepData {
        StepInfo step;
        bytes32 data;
        Sign[] userSigns;
    }

    DeedStatus public status;

    StepInfo[] public steps;
    StepData[] public doneSteps;
    uint256 public currentStepIndex;

    address public escrow;
    MetaDataInterface public metaData;

    address public seller;
    address public buyer;
    address public property;

    uint256 public price;
    uint256 public deduction;

    /// EVENTS

    event Error(string message);
    event RoleError(string message, address user);
    event StatusUpdate(DeedStatus status);
    event FeePaid(uint256 step, address payer, uint256 value);
    event StepDone(bytes32 title, uint256 step);
    event DocumentSaved(bytes32 documentHash, uint256 step);
    event DeductionAdded(uint256 value);
    event OwnershipTransfer(uint256 step, bool success);

    modifier onlyStatus(DeedStatus _status) {
        if (_status != status) {
            emit Error("Another contract status required.");
            return;
        }
        _;
    }

    modifier onlyNotStatus(DeedStatus _status) {
        if (_status == status) {
            emit Error("Any other contract status required.");
            return;
        }
        _;
    }

    modifier checkRoleExist(address _user) {
        if (_usersRegistry().getUserRole(_user) == uint256(0)) {
            emit RoleError("User does not registered in the UsersRegistry.", _user);
            return;
        }
        _;
    }

    modifier notNull(address _user) {
        if (_user == address(0)) {
            emit Error("Address shouldn't have zero value");
            return;
        }
        _;
    }

    function stepsCount() public view returns(uint256) {
        return steps.length;
    }

    function decodeAddress(bytes32 hash, uint8 v, bytes32 r, bytes32 s)
     public
     pure
     returns(address)
    {
        return ecrecover(hash, v, r, s);
    }

    /**
     *
     */
    function init(uint16[] moves, uint256[] roles, bytes flags)
     public
     onlyStatus(DeedStatus.NONE)
     onlyContractOwner
    {
        require(moves.length == roles.length && roles.length == flags.length);
        for(uint256 i = 0; i < moves.length; ++i) {
            steps.push(StepInfo({ moveId: moves[i], requiredRoles: roles[i], flag: flags[i] }));
        }
        _setStatus(DeedStatus.PREPARED);
    }

    function reserve(
        address _property,
        uint256 _price,
        address _seller,
        address _buyer,
        address _escrow,
        address[] _intermediaries,
        uint256[] _payments
    ) 
     public 
     only(_controller())
     onlyStatus(DeedStatus.PREPARED)
     checkRoleExist(_seller)
     checkRoleExist(_buyer)
     notNull(_property)
     notNull(_escrow)
     returns(bool)
    {
        if (!EscrowInterface(_escrow).init(_price, _payments)) {
            // In this case error is being emitted in the escrow contract.
            return false;
        }
        property = _property;
        price = _price;
        seller = _seller;
        buyer = _buyer;
        escrow = _escrow;
        // Add intermediaries
        _setStatus(DeedStatus.RESERVED);
    }

    function action(bytes32 documentHash, uint8[] v, bytes32[] r, bytes32[] s)
     external
     onlyStatus(DeedStatus.RESERVED)
    {
        if (!_checkSignsToRequiredRole(documentHash, v, r, s)) {
            return;
        }
        Sign[] memory signs = new Sign[](v.length);
        for(uint8 i = 0; i < v.length; ++i) {
            signs[i] = (Sign({ v: v[i], r: r[i], s: s[i] }));
        }
        if(_isFinalStep()) {
            if (!_approveOwnershipTransfer()) {
                return;
            }
        }
        doneSteps.push(StepData({ data: documentHash, step: steps[currentStepIndex], userSigns: signs }));
        _nextStep();
    }

    function payment(uint256 amount) 
     public
     only(escrow)
     onlyStatus(DeedStatus.RESERVED)
    {

    }

    function _approveOwnershipTransfer() internal returns(bool) {
        if (_payFee()) {
            PropertyInterface _property = PropertyInterface(property);
            assert(_property.approveOwnershipTransfer(buyer));
            emit OwnershipTransfer(currentStepIndex, true);
            _setStatus(DeedStatus.FINISHED);
            return true;
        }
        return false;
    }

    function _rejectOwnershipTransfer() internal returns(bool) {
        PropertyInterface Property = PropertyInterface(property);
        assert(Property.rejectOwnershipTransfer());
        emit OwnershipTransfer(currentStepIndex, false);
        _setStatus(DeedStatus.REJECTED);
        return true;
    }

    /**
     * `_approveOwnershipTransfer` subfunction
     * Pay the fee.
     */
    function _payFee() internal returns(bool) {
        ControllerInterface controller = _controller();
        FeeCalcInterface FeeContract = _feeCalc();
        TokenInterface token = _token();

        address companyWallet = controller.companyWallet();
        address networkGrowthPoolWallet = controller.networkGrowthPoolWallet();
        uint256 companyFee = FeeContract.getCompanyFee(price);
        uint256 networkGrowthFee = FeeContract.getNetworkGrowthFee(price);
        if (companyWallet == address(0) || networkGrowthPoolWallet == address(0)) {
            emit Error("Some fee wallet is null.");
            return false;
        }
        if (token.allowance(buyer, address(this)) < (companyFee + networkGrowthFee) || 
                token.balanceOf(buyer) < (companyFee + networkGrowthFee)) {
            emit Error("Buyer's balance are too low or not allowed");
            return false;
        }
        assert(token.transferFrom(buyer, companyWallet, companyFee));
        assert(token.transferFrom(buyer, networkGrowthPoolWallet, networkGrowthFee));

        emit FeePaid(currentStepIndex, buyer, companyFee + networkGrowthFee);
        return true;
    }

    function _calcPrice() internal returns(uint256) {
        assert((price - deduction) > price);
        return price - deduction;
    }

    function _nextStep() internal {
        emit StepDone(_currentStepTitle(), currentStepIndex);
        if(!_isFinalStep()) {
            currentStepIndex++;
        }
    }

    function _controller() internal view returns(ControllerInterface) {
        return ControllerInterface(metaData.controller());
    }

    function _token() internal view returns(TokenInterface) {
        return TokenInterface(_controller().token());
    }

    function _feeCalc() internal view returns(FeeCalcInterface) {
        return FeeCalcInterface(_controller().feeCalc());
    }

    function _usersRegistry() internal view returns(UsersRegistryInterface) {
        return UsersRegistryInterface(_controller().usersRegistry());
    }

    function _isFinalStep() internal view returns(bool) {
        return currentStepIndex == (stepsCount() - 1);
    }

    function _currentStepTitle() internal view returns(bytes32) {
        return "";
    }

    function _checkSignsToRequiredRole(bytes32 documentHash, uint8[] v, bytes32[] r, bytes32[] s) internal returns(bool) {
        if(v.length != r.length || r.length != s.length) {
            emit Error("Sign data must have identical size.");
            return false;
        }
        uint256 roles = uint256(0);
        for (uint256 _s = 0; _s < v.length; ++_s) {
            address _user = decodeAddress(documentHash, v[_s], r[_s], s[_s]);
            if (!_validateUserRole(_user)) {
                emit RoleError("User's role are invalid.", _user);
                return false;
            }
            roles |= _usersRegistry().getUserRole(_user);
        }
        if (roles != steps[currentStepIndex].requiredRoles) {
            emit Error("Sign set doesn't match to required roles.");
            return false;
        }
        return true;
    }

    function _validateUserRole(address user) internal view returns(bool) {
        return (_usersRegistry().getUserRole(user) & steps[currentStepIndex].requiredRoles) == _usersRegistry().getUserRole(user);
    }

    function _setStatus(DeedStatus _status) internal returns(bool) {
        if (status == _status) {
            return false;
        }
        status = _status;
        emit StatusUpdate(_status);
    }

    function kill()
     public
     onlyContractOwner
     onlyNotStatus(DeedStatus.FINISHED)
    {
        selfdestruct(msg.sender);
    }

}