pragma solidity 0.4.23;

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
    function transfer(address, uint256) public returns(bool);
}

contract FeeCalcInterface {
    function getFee(uint256) public constant returns(uint256);
    function getCompanyFee(uint256) public constant returns(uint256);
    function getNetworkGrowthFee(uint256) public constant returns(uint256);
}

contract EscrowInterface {
    function init(uint256) public returns(bool);
    function checkPayment(uint256) public view returns(bool);
    function payment() public constant returns(uint256);
}

contract PropertyInterface {
    function approveOwnershipTransfer(address[]) public returns(bool);
    function rejectOwnershipTransfer() public returns(bool);
}

contract Deed is Owned, AddressChecker {

    uint256 private constant USERS_MAX = 64;

    // 0000 0000
    // High 4 bit is status bits
    // Low 4 bit is user bits
    uint8 private constant SELLER = 0x1; // Seller side
    uint8 private constant BUYER = 0x2; // Buyer side
    uint8 private constant OWNERSHIP = 0x4; // Transafer ownership access
    uint8 private constant SINGLE_ROLE = 0x40; 
    uint8 private constant DONE_STEP = 0x80;

    enum DeedStatus {
        NONE,
        PREPARED,
        RESERVED,
        STARTED,
        FEEPAID,
        FINISHED,
        REJECTED
    }

    struct Sign {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct StepInfo {
        uint256 nextStep;

        uint16 stepType;
        uint8 requiredDocsCount;
        uint256 roles;
        uint8 flag;
    }

    DeedStatus public status;

    mapping(uint256 => StepInfo) public steps;
    mapping(uint256 => uint8) public loadedDocuments;
    mapping(bytes32 => Sign[]) private signs;

    uint256 private lastStep;
    uint256 private indexStep;
    uint256 private currentStep;

    EscrowInterface public escrow;
    ControllerInterface public controller;

    address public property;
    address[] public buyers;
    mapping(address => uint8) public users;
    mapping(address => uint8[2]) public parts;

    uint256 public price;

    /// EVENTS

    event RoleError(string message, address user);
    event StatusUpdate(DeedStatus status);
    event FeePaid(address payer, uint256 value);
    event StepCreated(uint16 stepType, uint256 roles, uint8 flag);
    event StepDone(uint16 stepType, uint256 step);
    event UserSet(address user, uint256 role, uint8 flag);
    event DocumentSaved(bytes32 documentHash, uint256 step);
    event OwnershipTransfer(bool success);
    event PriceChanged(uint256 oldPrice, uint256 newPrice);

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

    modifier checkFlagAccess(address _user, uint8 _flag) {
        if (!_checkBit(users[_user], _flag)) {
            emit Error("User access denied!");
            return;
        }
        _;
    }

    modifier onlyFinal() {
        if (!_isFinalStep()) {
            emit Error("Not all steps are done!");
            return;
        }
        _;
    }

    function decodeAddress(bytes32 hash, uint8 v, bytes32 r, bytes32 s)
     public
     pure
     returns(address)
    {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        hash = keccak256(prefix, hash);
        return ecrecover(hash, v, r, s);
    }

    function getStepFlow() public view returns(uint256[]) {
        uint256[] memory flow = new uint256[](indexStep);
        uint256 index = 0;
        for(uint256 i = 0; i < indexStep; ++i) {
            flow[i] = index;
            index = steps[index].nextStep;
        }
        return flow;
    }

    function isSignedBy(bytes32 _dataHash, address _user) public view returns(bool) {
        Sign[] storage _signs = signs[_dataHash];
        for(uint256 i = 0; i < _signs.length; ++i) {
            address _signer = decodeAddress(_dataHash, _signs[i].v, _signs[i].r, _signs[i].s);
            if (_signer == _user) {
                return true;
            }
        }
        return false;
    }

    constructor(address _owner, address _controller) public {
        contractOwner = _owner;
        controller = ControllerInterface(_controller);
    }

    /**
     *
     */
    function init(uint16[] moves, uint256[] roles, uint8[] documents, bytes flags)
     public
     onlyStatus(DeedStatus.NONE)
     onlyContractOwner
    {
        require(moves.length == roles.length && roles.length == flags.length);
        uint256 index = indexStep;
        uint256 last = lastStep;
        for(uint256 i = 0; i < moves.length; ++i) {
            if(index != 0) {
                steps[last].nextStep = index;
            }
            steps[index] = StepInfo({
                stepType: moves[i],
                roles: roles[i],
                requiredDocsCount: documents[i],
                flag: uint8(flags[i]),

                nextStep: 0
            });
            last = index;
            index++;
            emit StepCreated(moves[i], roles[i], uint8(flags[i]));
        }
        lastStep = last;
        indexStep = index;
        _setStatus(DeedStatus.PREPARED);
    }

    function addStep(uint16 stepType, uint256 role, uint8 documents, bytes1 flag)
     public
     onlyNotStatus(DeedStatus.FEEPAID)
     onlyNotStatus(DeedStatus.FINISHED)
     onlyNotStatus(DeedStatus.REJECTED)
     onlyContractOwner
    {
        if(indexStep != 0) {
            steps[lastStep].nextStep = indexStep;
        }
        steps[indexStep] = StepInfo({
            stepType: stepType,
            roles: role,
            requiredDocsCount: documents,
            flag: uint8(flag),

            nextStep: 0
        });
        lastStep = indexStep;
        indexStep++;
        emit StepCreated(stepType, role, uint8(flag));
    }

    function reserve(
        address _property,
        uint256 _price,
        address _escrow
    ) 
     public
     onlyContractOwner
     onlyStatus(DeedStatus.PREPARED)
     notNull(_property)
     notNull(_escrow)
     returns(bool)
    {
        if (!EscrowInterface(_escrow).init(_price)) {
            // In this case error is being emitted in the escrow contract.
            return false;
        }
        property = _property;
        price = _price;
        escrow = EscrowInterface(_escrow);
        _setStatus(DeedStatus.RESERVED);
    }

    function initUsers(
        address[] _users,
        bytes flags
    )
     public
     onlyStatus(DeedStatus.RESERVED)
     onlyContractOwner
    {
        if(_users.length != flags.length) {
            emit Error("Amount of users not equals to flags!");
            return;
        }
        for(uint256 i = 0; i < _users.length && i < USERS_MAX; ++i) {
            users[_users[i]] = uint8(flags[i]);
            // FIXME: Possible mistaken remove BUYER bit without removing from buyers array
            if(_checkBit(uint8(flags[i]), BUYER) && !_checkBit(users[_users[i]], BUYER)) {
                buyers.push(_users[i]);
            }
            emit UserSet(_users[i], _usersRegistry().getUserRole(_users[i]), uint8(flags[i]));
        }
        _setStatus(DeedStatus.STARTED);
    }

    function setUser(
        address user,
        bytes1 flag
    )
     public
     onlyStatus(DeedStatus.STARTED)
     onlyContractOwner
    {
        // FIXME: Possible mistaken remove BUYER bit without removing from buyers array
        if(_checkBit(uint8(flag), BUYER) && !_checkBit(users[user], BUYER)) {
            buyers.push(user);
        }
        users[user] = uint8(flag);
        emit UserSet(user, _usersRegistry().getUserRole(user), uint8(flag));
    }

    function setBuyersParts(
        address[] _buyers,
        uint8[2][] _parts
    )
     public
     onlyStatus(DeedStatus.STARTED)
     onlyContractOwner
    {
        require(_buyers.length == _parts[0].length && _parts[0].length == _parts[1].length, "Arrays has not equals length!");
        require(_buyers.length == buyers.length, "Input array does not correct!");
        for (uint256 i = 0; i < _buyers.length && i < USERS_MAX; ++i) {
            require(_checkBit(users[_buyers[i]], BUYER), "Some user not a buyer!");
            parts[_buyers[i]][0] = _parts[0][i];
            parts[_buyers[i]][1] = _parts[1][i];
        }
    }

    function action(bytes32 documentHash, uint8[] v, bytes32[] r, bytes32[] s)
     external
     onlyStatus(DeedStatus.STARTED)
    {
        if (!_checkSignsToRequiredRole(documentHash, v, r, s) ||
         !_checkSignsToRequiredFlag(documentHash, v, r, s)) {
            return;
        }
        for(uint8 i = 0; i < v.length; ++i) {
            signs[documentHash].push(Sign({ v: v[i], r: r[i], s: s[i] }));
            loadedDocuments[currentStep]++;
        }
        if (loadedDocuments[currentStep] >= steps[currentStep].requiredDocsCount) {
            steps[currentStep].flag |= DONE_STEP;
        }
        emit DocumentSaved(documentHash, currentStep);
        _nextStep();
    }

    function payFee()
     public
     onlyStatus(DeedStatus.STARTED)
     onlyFinal()
    {
        require(escrow.checkPayment(currentPrice()), "Payment does not done!");
        FeeCalcInterface FeeContract = _feeCalc();
        TokenInterface token = _token();

        address companyWallet = controller.companyWallet();
        address networkGrowthPoolWallet = controller.networkGrowthPoolWallet();
        uint256 companyFee = FeeContract.getCompanyFee(currentPrice());
        uint256 networkGrowthFee = FeeContract.getNetworkGrowthFee(currentPrice());
        if (companyWallet == address(0) || networkGrowthPoolWallet == address(0)) {
            emit Error("Some fee wallet is null.");
            return;
        }
        if (token.balanceOf(address(this)) < (companyFee + networkGrowthFee)) {
            emit Error("Deed balance are too low!");
            return;
        }
        assert(token.transfer(companyWallet, companyFee));
        assert(token.transfer(networkGrowthPoolWallet, networkGrowthFee));

        emit FeePaid(address(this), companyFee + networkGrowthFee);
        _setStatus(DeedStatus.FEEPAID);
    }

    function setPrice(uint256 newPrice)
     public
     onlyStatus(DeedStatus.STARTED)
     onlyContractOwner
    {
        emit PriceChanged(price, newPrice);
        price = newPrice;
    }

    function ownershipTransfer(bytes32 documentHash, uint8[] v, bytes32[] r, bytes32[] s)
     external
     onlyStatus(DeedStatus.FEEPAID)
    {
        if (!_checkSignsToRequiredRole(documentHash, v, r, s) ||
         !_checkSignsToRequiredFlag(documentHash, v, r, s)) {
            return;
        }
        for(uint8 i = 0; i < v.length; ++i) {
            signs[documentHash].push(Sign({ v: v[i], r: r[i], s: s[i] }));
        }
        emit DocumentSaved(documentHash, currentStep);
        PropertyInterface _property = PropertyInterface(property);
        assert(_property.approveOwnershipTransfer(buyers));
        emit OwnershipTransfer(true);
        _setStatus(DeedStatus.FINISHED);
    }

    function rejectOwnershipTransfer() 
     external
     onlyStatus(DeedStatus.STARTED)
     checkFlagAccess(msg.sender, OWNERSHIP)
    {
        // TODO: Need to return remains tokens to buyer (buyers)
        PropertyInterface Property = PropertyInterface(property);
        assert(Property.rejectOwnershipTransfer());
        emit OwnershipTransfer(false);
        _setStatus(DeedStatus.REJECTED);
    }

    function currentPrice() public view returns(uint256) {
        return price;
    }

    function _nextStep() internal {
        if(_checkBit(steps[currentStep].flag, DONE_STEP) &&
         loadedDocuments[currentStep] >= steps[currentStep].requiredDocsCount) {
            emit StepDone(steps[currentStep].stepType, currentStep);
            if(!_isFinalStep()) {
                currentStep = steps[currentStep].nextStep;
            }
        }
    }

    function _controller() internal view returns(ControllerInterface) {
        return controller;
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
        return steps[currentStep].nextStep == 0;
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
        if (roles != steps[currentStep].roles && !_checkBit(steps[currentStep].flag, SINGLE_ROLE)) {
            emit Error("Sign set doesn't match to required roles.");
            return false;
        }
        return true;
    }

    function _checkSignsToRequiredFlag(bytes32 documentHash, uint8[] v, bytes32[] r, bytes32[] s) internal returns(bool) {
        if(v.length != r.length || r.length != s.length) {
            emit Error("Sign data must have identical size.");
            return false;
        }
        for (uint256 _s = 0; _s < v.length; ++_s) {
            address _user = decodeAddress(documentHash, v[_s], r[_s], s[_s]);
            if (!_checkBit(steps[currentStep].flag, users[_user])) {
                emit RoleError("User's flag are invalid.", _user);
                return false;
            }
        }
        return true;
    }

    function _validateUserRole(address user) internal view returns(bool) {
        return (_usersRegistry().getUserRole(user) & steps[currentStep].roles) == _usersRegistry().getUserRole(user);
    }

    function _checkBit(uint8 _flag, uint8 _bit) internal pure returns(bool) {
        return (_flag & _bit) == _bit;
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
     onlyNotStatus(DeedStatus.FEEPAID)
     onlyNotStatus(DeedStatus.FINISHED)
     onlyNotStatus(DeedStatus.REJECTED)
    {
        // NOTE: Send all remains tokens to the killer
        _token().transfer(msg.sender, _token().balanceOf(address(this)));
        selfdestruct(msg.sender);
    }

}