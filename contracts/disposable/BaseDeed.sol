pragma solidity ^0.4.18;

import "../base/Owned.sol";
import "../base/AddressChecker.sol";


contract MetaDeedInterface {
    function controller() public constant returns(address);
    function getMoveInfo(uint8) public constant returns(uint, uint, uint8, uint8, uint, uint, uint8, bool);
    function getIntermediariesCount() public constant returns(uint);
    function intermediaries(uint) public constant returns(uint);
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
    function init(uint256, uint256[]) public returns(bool);
    function assignPayment(uint8, uint8, address, address) public returns(bool);
}

contract PropertyInterface {
    function approveOwnershipTransfer(address) returns(bool);
    function rejectOwnershipTransfer() returns(bool);
}


contract BaseDeed is Owned, AddressChecker {

    // META //

    enum Status {
        NOT_SET,
        RESERVED
    }

    Status public status;

    MetaDeedInterface public metaDeed;

    // PROPERTY //
    address public property;
    uint256 public price;  // TODO: Change price in the middle of the process.

    // PARTIES //
    address public seller;
    address public buyer;
    address public escrow;
    address[] public intermediaries;
    mapping (address => uint) parties;  // Get party by actor
    mapping (uint => address) actors;  // Get actor by party

    // WORKFLOW //
    enum MoveStatus {
        NOT_SET,
        SUCCESS,
        FAILED
    }
    mapping (uint8 => MoveStatus) public moves;
    mapping (uint8 => mapping(bytes32 => bytes32)) data;  // Data provided at certain move by certain party

    // We fetch basic move info from the Meta Deed
    struct MoveInfo {
        uint party;  // Party required to act
        uint role;  // Role that `party` must have
        uint8 args;  // Minimum number of args required
        uint8 dependency;  // The `Move` this `Move` depends on

        uint receiver;  // Pay this party on move success
        uint returnTo;  // Return to this party if move fails
        uint8 unlockPaymentAt;  // Binds to the pending payment. Withdraw can be done once `unlockPaymentAt` `Move` is done.

        bool isFinal;  // If move is final, approve or reject ownership transfer, based on move status.
    }


    /// MODIFIERS ///

    event D(uint x);

    modifier onlyStatus(Status _status) {
        if (_status != status) {
            Error("Another contract status required.");
            return;
        }
        _;
    }

    modifier onlyNotStatus(Status _status) {
        if (_status == status) {
            Error("Any other contract status required.");
            return;
        }
        _;
    }


    /// EVENTS ///

    event StatusUpdate(Status status);
    //event PropyFee(address indexed deed, uint256 companyFee, uint256 networkGrowthFee);
    event PartyDesignated(uint party, address who);
    event PartyDeprived(uint party, address who);
    event ServiceChanged(string name, address oldAddress, address newAddress);

    event DataProvided(uint8 move, uint party, address who, bytes32 key, bytes32 value);
    event MoveDone(uint8 move, uint8 status);  // Another parameters?
    event FeePaid(uint8 move, address payer, uint256 value);
    event FeeReleased(uint8 move, address payer, uint256 value);
    event OwnershipTransfer(uint8 move, bool approved);

    event Error(string msg);
    event DebugAddress(address addr);
    event DebugBool(bool boolean);
    event DebugUint8(uint8 number);
    event DebugUint(uint number);


    /// CONSTRUCTOR ///

    function BaseDeed(address _metaDeed) {
        metaDeed = MetaDeedInterface(_metaDeed);
    }



    /// SETTINGS ///

    function setMetaDeed(address _metaDeed)
        onlyContractOwner
        notNull(_metaDeed)
    returns(bool) {
        ServiceChanged("MetaDeed", metaDeed, _metaDeed);
        metaDeed = MetaDeedInterface(_metaDeed);
        return true;
    }

    /// CONTROLLER FUNCTIONS ///

    /**
     * Reserve pre-deployed Deed for some parties (prepare for deal).
     */
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
        onlyStatus(Status.NOT_SET)
    returns(bool) {
        if (
            _property == address(0) ||
            _price == 0 ||
            _seller == address(0) ||
            _buyer == address(0) ||
            _escrow == address(0) ||
            _payments.length == 0
        ) {
            Error("Some of arguments are invalid.");
            return false;
        }

        uint intermediariesCount = metaDeed.getIntermediariesCount();
        if (intermediariesCount != _intermediaries.length) {
            Error("Provided intermediaries list do not match with required one.");
            return false;
        }

        if (!EscrowInterface(_escrow).init(_price, _payments)) {
            // In this case error is being emitted in the escrow contract.
            return false;
        }

        // Assign meta info
        property = _property;
        price = _price;

        // Assign main parties
        seller = _seller;
        buyer = _buyer;
        escrow = _escrow;

        // Designate parties for main parties
        parties[_seller] = 1;
        actors[1] = _seller;
        PartyDesignated(1, _seller);

        parties[_buyer] = 2;
        actors[2] = _buyer;
        PartyDesignated(2, _buyer);

        parties[_escrow] = 3;
        actors[3] = _escrow;
        PartyDesignated(3, _escrow);

        // Designate intermediaries
        uint party;
        for (uint8 i = 0; i < intermediariesCount; i++) {
            party = metaDeed.intermediaries(i);
            // Ensure the party is free
            assert(
                actors[party] == address(0) &&
                parties[actors[party]] == 0
            );

            intermediaries.push(_intermediaries[i]);

            parties[_intermediaries[i]] = party;
            actors[party] = _intermediaries[i];
            PartyDesignated(party, _intermediaries[i]);
        }

        // Basically checks if call is successful
        require(_reserveCallback(_property, _price, _seller, _buyer, _escrow, _intermediaries, _payments));
        status = Status.RESERVED;
        StatusUpdate(Status.RESERVED);
        return true;
    }

    // Can implement custom functionality on inheritance, if needed.
    function _reserveCallback(
        address _property,
        uint256 _price,
        address _seller,
        address _buyer,
        address _escrow,
        address[] _intermediaries,
        uint256[] _payments
    )
        onlyStatus(Status.NOT_SET)
        internal
    returns(bool) {
        return true;
    }

    /**
     * Change actor address of some of the intermediaries.
     */
    function changeIntermediary(uint _intermediariesIndex, address _newActor)
        public
        onlyNotStatus(Status.NOT_SET)
        only(_controller())
    returns(bool) {
        // TODO: Get address from `intermediaries`;
        // TODO: Get actor's role from `roles`;
        // TODO: Check if `_newActor` has the role;
        // TODO: Replace old actor with `_newActor` in `intermediaries` list;
        // TODO: Replace old actor with `_newActor` in `actors` mapping;
        // TODO: Delete old actor address from `roles` mapping;
        // TODO: Emit role deprived;
        // TODO: Add `_newActor` to `roles` mapping;
        // TODO: Emit role designated.
        // TODO: Change wallet in the Escrow contract
        return true;
    }



    /// PUBLIC ///

    /**
     * Move by certain party.
     *
     * Parties make moves, each of which can depend on an arbitrary number of other moves.
     * At each move a party can provide arbitrary number of data arguments, and also
     * can provide a payment, that an arbitrary party can withdraw after an arbitrary move.
     */
    function action(uint8 _move, bytes32[] _keys, bytes32[] _values, MoveStatus _status)
        public
        onlyStatus(Status.RESERVED)
    returns(bool) {
        if (_move <= 0) {
            Error("Wrong Move number.");
            return false;
        }

        // It should actually throw an exception if _status > 2, but let it be, just in case.
        if (_status != MoveStatus.SUCCESS && _status != MoveStatus.FAILED) {
            Error("Wrong Move status.");
            return false;
        }

        // Move must not be finished
        if (moves[_move] != MoveStatus.NOT_SET) {
            Error("Move is already done.");
            return false;
        }

        MoveInfo memory move = _fetchMoveInfo(_move);

        if (move.dependency > 0) {
            if (moves[move.dependency] == MoveStatus.NOT_SET) {
                Error("Dependency move is not done yet.");
                return false;
            } else if (moves[move.dependency] == MoveStatus.FAILED) {
                Error("Dependency move failed");
                return false;
            }
        }

        // Sender must be the required party
        if (msg.sender != actors[move.party]) {
            Error("Sender is not the required party.");
            return false;
        }

        // FIXME
        // Skip seller, buyer and escrow party checks (Maybe check for at least presence in the user registry?)
        if (move.role > 0) {
            if (!_checkRole(msg.sender, move.role)) {
                Error("Sender has no required role.");
                return false;
            }
        }

        if (!_checkData(_move, move, _keys, _values)) {
            return false;
        }

        _assignPayment(_move, move);

        // Call additional function that can be
        // overridden on inheritance, it must return `true`.
        require(_callback(_move, move, _keys, _values, _status));

        if (move.isFinal) {
            if (_status == MoveStatus.FAILED) {
                _rejectOwnershipTransfer(_move);
            }
            else if (_status == MoveStatus.SUCCESS) {
                _approveOwnershipTransfer(_move);
            }
        }

        moves[_move] = _status;
        MoveDone(_move, uint8(_status));
        return true;
    }

    /**
     * `reserve` and `action` subfunction.
     * Check `party`s `role`
     */
    function _checkRole(address _actor, uint _role) internal returns(bool) {
        return _usersRegistry().hasRole(_actor, _role);
    }

    /**
     * `action` subfunction.
     * Check and save provided data.
     */
    function _checkData(uint8 _move, MoveInfo move, bytes32[] _keys, bytes32[] _values) internal returns(bool) {
        // Check and write down the data
        if (move.args > 0) {
            // Data length must be correct
            if (_keys.length != _values.length) {
                Error("Provided data arrays are of different length.");
                DebugUint(_keys.length);
                DebugUint(_values.length);
                return false;
            }
            // Provided arguments number must be at least `move.args` big.
            if (_keys.length < move.args) {
                Error("Provided number of arguments is less than required.");
                DebugUint(_keys.length);
                DebugUint(move.args);
                return false;
            }
            for (uint8 d = 0; d < _keys.length; d++) {
                // Key and value must not be empty (Maybe only the key?)
                require(_keys[d] != bytes32(0) && _values[d] != bytes32(0));
                // Item should be free
                require(data[_move][_keys[d]] == bytes32(0));  // FIXME: Add awaiting keys check!
                data[_move][_keys[d]] = _values[d];
                DataProvided(_move, move.party, msg.sender, _keys[d], _values[d]);
            }
            return true;
        } else {
            if (_keys.length != 0) {
                Error("There should be no arguments provided.");
                DebugUint(_keys.length);
                return false;
            }
            return true;
        }
    }


    /**
     * `action` subfunction.
     * Assign payment to the current actor (in a "pull" way). Payment will be unlocked at specified `Move`.
     */
    function _assignPayment(uint8 _move, MoveInfo move) internal {
        if (move.unlockPaymentAt > 0) {
            UsersRegistryInterface UsersRegistry = _usersRegistry();

            address receiverWallet = UsersRegistry.getWallet(actors[move.receiver]);
            address returnToWallet = UsersRegistry.getWallet(actors[move.returnTo]);
            assert(receiverWallet != address(0) && returnToWallet != address(0));

            require(EscrowInterface(escrow).assignPayment(
                _move,
                move.unlockPaymentAt,
                receiverWallet,
                returnToWallet
            ));
        }
    }

    /**
     * `action` subfunction.
     * Custom callback that should be defined in child contracts, if needed.
     */
    function _callback(uint8 _move, MoveInfo move, bytes32[] _keys, bytes32[] _values, MoveStatus _status) internal returns(bool) {
        // To override on inheritance
        return true;
    }

    /**
     * `action` subfunction.
     */
    function _approveOwnershipTransfer(uint8 _move) internal {
        _payFee(_move);
        PropertyInterface Property = PropertyInterface(property);
        Property.approveOwnershipTransfer(buyer);
        OwnershipTransfer(_move, true);
    }

    /**
     * `_approveOwnershipTransfer` subfunction
     * Pay the fee and release the change to the buyer.
     */
    function _payFee(uint8 _move) internal {
        ControllerInterface controller = _controller();
        FeeCalcInterface FeeContract = _feeCalc();
        TokenInterface token = _token();

        // Charge company fee
        address companyWallet = controller.companyWallet();
        //assert(companyWallet != address(0));
        uint256 companyFee = FeeContract.getCompanyFee(price);
        assert(token.transfer(companyWallet, companyFee));
        // Charge network growth fee
        address networkGrowthPoolWallet = controller.networkGrowthPoolWallet();
        //assert(networkGrowthPoolWallet != address(0));
        uint256 networkGrowthFee = FeeContract.getNetworkGrowthFee(price);
        assert(token.transfer(networkGrowthPoolWallet, networkGrowthFee));

        FeePaid(_move, buyer, companyFee + networkGrowthFee);

        // Return change back to buyer
        uint256 excessFee = token.balanceOf(address(this));
        if (excessFee > 0) {
            assert(token.transfer(buyer, excessFee));
        }
    }

    /**
     * `action` subfunction.
     */
    function _rejectOwnershipTransfer(uint8 _move) internal {
        //_releaseFee(_move);
        PropertyInterface Property = PropertyInterface(property);
        assert(Property.rejectOwnershipTransfer());
        OwnershipTransfer(_move, false);
    }

    /// GETTERS ///

    function _fetchMoveInfo(uint8 _move) internal returns(MoveInfo) {
        var (
            party, role, args, dependency, receiver, returnTo, unlockPaymentAt, isFinal
        ) = metaDeed.getMoveInfo(_move);
        return MoveInfo(party, role, args, dependency, receiver, returnTo, unlockPaymentAt, isFinal);
    }

    function _controller() internal constant returns(ControllerInterface) {
        return ControllerInterface(metaDeed.controller());
    }

    function _token() internal constant returns(TokenInterface) {
        return TokenInterface(_controller().token());
    }

    function _feeCalc() internal constant returns(FeeCalcInterface) {
        return FeeCalcInterface(_controller().feeCalc());
    }

    function _usersRegistry() internal constant returns(UsersRegistryInterface) {
        return UsersRegistryInterface(_controller().usersRegistry());
    }


    /// RESTRICTIONS & DISASTER RECOVERY ///

    function kill() public onlyContractOwner {
        selfdestruct(msg.sender);
    }

}
