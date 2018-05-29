pragma solidity 0.4.23;

import "../../base/Owned.sol";
import "../../base/AddressChecker.sol";

pragma experimental "v0.5.0"; // Include 0.5.0 features !

contract ControllerInterface {
    function feeCalc() public constant returns(address);
    function token() public constant returns(address);
    function usersRegistry() public constant returns(address);

    function companyWallet() public constant returns(address);
    function networkGrowthPoolWallet() public constant returns(address);
}

contract UsersRegistryInterface {
    function getUserRole(address) public constant returns(uint);
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
    function checkPayment() public view returns(bool);
}

contract PropertyInterface {
    function approveOwnershipTransfer(address[], uint16[]) public returns(bool);
    function rejectOwnershipTransfer() public returns(bool);
}

contract DeedSimple is Owned, AddressChecker {

    uint256 private constant USERS_MAX = 64;
    uint8 private constant USERS_BIT_MASK = 0xF; // 0000 1111

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

    struct StepInfo {
        bytes4 stepType;
        uint8 requiredDocsCount;
    }

    DeedStatus public status;

    mapping(uint256 => StepInfo) public steps;
    mapping(uint256 => uint256) private flow;
    mapping(uint256 => uint8) private loadedDocuments;
    mapping(bytes32 => address) private signs;

    uint256 private firstStep;
    uint256 private indexStep;
    uint256 private currentStep;

    EscrowInterface public escrow;
    ControllerInterface public controller;

    address public property;
    address[] public buyers;
    mapping(address => uint8) public users;
    mapping(address => uint16) public parts;

    uint256 public price;

    /// EVENTS

    event RoleError(string message, address user);
    event StatusUpdate(DeedStatus status);
    event FeePaid(address payer, uint256 value);
    event StepCreated(bytes4 stepType, uint256 roles, uint8 flag, uint256 stepId);
    event StepDone(bytes4 stepType, uint256 stepId);
    event UserSet(address user, uint256 role, uint8 flag);
    event DocumentSaved(bytes32 documentHash, uint256 stepId);
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

    modifier onlyFinal() {
        if (!_isFinalStep() || !_checkBit(steps[currentStep].flag, DONE_STEP)) {
            emit Error("Not all steps are done!");
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

    function getStepFlow() public view returns(uint256[]) {
        uint256[] memory _flow = new uint256[](indexStep);
        uint256 index = firstStep;
        for(uint256 i = 0; i < indexStep; ++i) {
            _flow[i] = index;
            index = flow[index];
        }
        return _flow;
    }

    constructor (address _controller) public {
        controller = ControllerInterface(_controller);
    }

    function unsafe_construct(address _owner, address _controller) public {
        require(contractOwner == address(0));
        contractOwner = _owner;
        controller = ControllerInterface(_controller);
    }

    /**
     * Counts it is packed 'minimumSignsCount' and 'requiredDocsCount'
     *       0000 0000           0000 0000         -> ( 1.(0000 0000) 2.(0000 0000) )
     *  1.minimumSignsCount  2.requiredDocsCount
     */ 
    function init(bytes4[] moves, uint8[] counts)
     public
     onlyStatus(DeedStatus.NONE)
     onlyContractOwner
    {
        require(moves.length == counts.length);
        currentStep = 1;
        for(uint256 i = 0; i < moves.length; ++i) {
            uint8 _docs = uint8(counts[i]);
            _insertStep(StepInfo({
                stepType: moves[i],
                requiredDocsCount: _docs
            }), 0);
        }
        _setStatus(DeedStatus.PREPARED);
    }

    function insertStep(bytes4 stepType, uint8 counts, uint256 stepId)
     public
     onlyNotStatus(DeedStatus.FEEPAID)
     onlyNotStatus(DeedStatus.FINISHED)
     onlyNotStatus(DeedStatus.REJECTED)
     onlyContractOwner
    {
        uint8 _docs = uint8(counts);
        _insertStep(StepInfo({
            stepType: stepType,
            requiredDocsCount: _docs
        }), stepId);
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
        require(_users.length <= USERS_MAX, "Users too many!");
        if(_users.length != flags.length) {
            emit Error("Amount of users not equals to flags!");
            return;
        }
        for(uint256 i = 0; i < _users.length; ++i) {
            users[_users[i]] = uint8(flags[i]);
            // FIXME: Possible mistaken remove BUYER bit without removing from buyers array
            if(_checkBit(users[_users[i]], BUYER) &&
                    _usersRegistry().getUserRole(_users[i]) == 128) {
                buyers.push(_users[i]);
            }
            emit UserSet(_users[i], _usersRegistry().getUserRole(_users[i]), uint8(flags[i]));
        }
        _setStatus(DeedStatus.STARTED);
    }

    function setUser(
        address user,
        uint8 flag
    )
     public
     onlyStatus(DeedStatus.STARTED)
     onlyContractOwner
    {
        users[user] = flag;
        // FIXME: Possible mistaken remove BUYER bit without removing from buyers array
        if(_checkBit(users[user], BUYER) && 
                _usersRegistry().getUserRole(user) == 128) {
            buyers.push(user);
        }
        emit UserSet(user, _usersRegistry().getUserRole(user), flag);
    }

    function setBuyersParts(
        address[] _buyers,
        uint16[] _parts
    )
     public
     onlyStatus(DeedStatus.STARTED)
     onlyContractOwner
    {
        require(_buyers.length == _parts.length, "Arrays has not equals length!");
        require(_buyers.length == buyers.length, "Input array does not correct!");
        for (uint256 i = 0; i < _buyers.length && i < USERS_MAX; ++i) {
            require(_checkBit(users[_buyers[i]], BUYER), "Some user not a buyer!");
            parts[_buyers[i]] = _parts[i];
        }
    }

    function action(bytes32 documentHash)
     external
     onlyStatus(DeedStatus.STARTED)
     onlyContractOwner
    {
        _nextStep();
        require(!_checkBit(steps[currentStep].flag, DONE_STEP), "Step is already done!");
        for(uint8 i = 0; i < v.length; ++i) {
            loadedDocuments[currentStep]++;
        }
        if (loadedDocuments[currentStep] >= steps[currentStep].requiredDocsCount) {
            steps[currentStep].flag |= DONE_STEP;
            emit StepDone(steps[currentStep].stepType, currentStep);
        }
        emit DocumentSaved(documentHash, currentStep);
    }

    function payFee()
     public
     onlyContractOwner
     onlyStatus(DeedStatus.STARTED)
     onlyFinal()
    {
        require(escrow.checkPayment(), "Payment does not done!");
        FeeCalcInterface FeeContract = _feeCalc();
        TokenInterface token = _token();

        address companyWallet = controller.companyWallet();
        address networkGrowthPoolWallet = controller.networkGrowthPoolWallet();
        uint256 companyFee = FeeContract.getCompanyFee(price);
        uint256 networkGrowthFee = FeeContract.getNetworkGrowthFee(price);
        if (companyWallet == address(0) || networkGrowthPoolWallet == address(0)) {
            emit Error("Some fee wallet is null.");
            return;
        }
        if (token.balanceOf(address(this)) < (companyFee + networkGrowthFee)) {
            emit Error("Deed balance is too low!");
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

    function ownershipTransfer(bytes32 documentHash)
     external
     onlyStatus(DeedStatus.FEEPAID)
     onlyContractOwner
    {
        emit DocumentSaved(documentHash, currentStep);
        PropertyInterface _property = PropertyInterface(property);
        uint16[] memory _parts = new uint16[](buyers.length);
        for(uint256 i = 0; i < buyers.length; ++i) {
            _parts[i] = parts[buyers[i]];
        }
        assert(_property.approveOwnershipTransfer(buyers, _parts));
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

    function _nextStep() internal {
        if(_checkBit(steps[currentStep].flag, DONE_STEP)) {
            if(!_isFinalStep()) {
                currentStep = flow[currentStep];
            }
        }
    }

    function _token() internal view returns(TokenInterface) {
        return TokenInterface(controller.token());
    }

    function _feeCalc() internal view returns(FeeCalcInterface) {
        return FeeCalcInterface(controller.feeCalc());
    }

    function _usersRegistry() internal view returns(UsersRegistryInterface) {
        return UsersRegistryInterface(controller.usersRegistry());
    }

    function _isFinalStep() internal view returns(bool) {
        return flow[currentStep] == 0;
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

    function _insertStep(StepInfo memory step, uint256 id) internal returns(bool) {
        require(!_checkBit(steps[id].flag, DONE_STEP), "Insert before done!");
        indexStep++;
        steps[indexStep] = step;
        uint256 prev = _findPrevious(id);
        if(prev != 0) {
            if(flow[prev] != 0) {
                flow[indexStep] = flow[prev];
            }
            flow[prev] = indexStep;
        }
        else if(id == firstStep) {
            firstStep = indexStep;
        }
        emit StepCreated(step.stepType, step.roles, step.flag, indexStep);
    }

    function _findPrevious(uint256 id) internal view returns(uint256) {
        uint256 prev = 0;
        for(uint256 current = firstStep; 
                current != 0 && current != id; current = flow[current]) {
            prev = current;
        }
        return prev;
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
