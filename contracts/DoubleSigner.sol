pragma solidity 0.5.8;

contract DoubleSigner {
    struct Operation {
        bytes31 hash;
        // 0 - not confirmed
        // 1 - confirmed by A
        // 2 - confirmed by B
        // 3 - fully confirmed
        uint8 status;
    }

    uint8 public constant oraclesCount = 2;
    uint8 constant signerFlagA = 1;
    uint8 constant signerFlagB = 2;

    address public oracleA;
    address public oracleB;
    address public pendingOracleA;
    address public pendingOracleB;

    mapping(address => uint8) public signerFlag;
    mapping(address => mapping(address => uint)) public signerConsumerNonce;
    mapping(address => Operation) operations; // Current consumer operation.

    event Confirmation(bytes32 indexed opHash, address indexed consumer, address indexed signer, uint8 status);
    event Consumption(bytes32 indexed opHash, address indexed consumer);
    event SignerAdded(address oracle, address signer);
    event SignerRemoved(address oracle, address signer);
    event OracleChangeRequested(address oracle, address newOracle);
    event OracleChangeCancelled(address oracle);
    event OracleChanged(address oracle, address newOracle);
    event Error(bytes32 message);

    modifier onlyOracle() {
        if (!isOracle(msg.sender)) {
            emit Error('Access denied');
            return;
        }
        _;
    }

    constructor (address _oracleA, address _oracleB) public {
        oracleA = _oracleA;
        oracleB = _oracleB;
    }

    function isOracle(address _oracle) public view returns(bool) {
        return _oracle == oracleA || _oracle == oracleB;
    }

    function isPendingOracle(address _pending) public view returns(bool) {
        return _pending == pendingOracleA || _pending == pendingOracleB;
    }

    function isA(address _oracle) public view returns(bool) {
        return _oracle == oracleA;
    }

    function isB(address _oracle) public view returns(bool) {
        return _oracle == oracleB;
    }

    function isPendingA(address _pending) public view returns(bool) {
        return _pending == pendingOracleA;
    }

    function getPendingOracleFor(address _oracle) public view returns(address) {
        assert(isOracle(_oracle));
        return isA(_oracle) ? pendingOracleA : pendingOracleB;
    }

    function isSigner(address _signer) public view returns(bool) {
        return signerFlag[_signer] != 0;
    }

    function getSignerFlagFor(address _oracle) public view returns(uint8) {
        assert(isOracle(_oracle));
        return isA(_oracle) ? signerFlagA : signerFlagB;
    }

    function changeOracle(address _newOracle) public onlyOracle() returns(bool) {
        if (isOracle(_newOracle)) {
            emit Error('Already an oracle');
            return false;
        }
        if (isA(msg.sender)) {
            pendingOracleA = _newOracle;
        } else {
            pendingOracleB = _newOracle;
        }
        emit OracleChangeRequested(msg.sender, _newOracle);
        return true;
    }

    function cancelChangeOracle() public onlyOracle() returns(bool) {
        if (getPendingOracleFor(msg.sender) == address(0)) {
            emit Error('Pending is not set');
            return true;
        }
        if (isA(msg.sender)) {
            delete pendingOracleA;
        } else {
            delete pendingOracleB;
        }
        emit OracleChangeCancelled(msg.sender);
        return true;
    }

    function confirmChangeOracle() public returns(bool) {
        if (!isPendingOracle(msg.sender)) {
            emit Error('Not a pending oracle');
            return false;
        }
        if (isPendingA(msg.sender)) {
            emit OracleChanged(oracleA, msg.sender);
            oracleA = msg.sender;
            delete pendingOracleA;
        } else {
            emit OracleChanged(oracleB, msg.sender);
            oracleB = msg.sender;
            delete pendingOracleB;
        }
        return true;
    }

    function addSigner(address _signer) public onlyOracle() returns(bool) {
        if (_signer == address(0)) {
            emit Error('Invalid signer');
            return false;
        }
        if (isSigner(_signer)) {
            emit Error('Already a signer');
            if (getSignerFlagFor(msg.sender) != signerFlag[_signer]) {
                return false;
            }
            return true;
        }
        signerFlag[_signer] = getSignerFlagFor(msg.sender);
        emit SignerAdded(msg.sender, _signer);
        return true;
    }

    function removeSigner(address _signer) public onlyOracle() returns(bool) {
        if (!isSigner(_signer)) {
            emit Error('Not a signer');
            return true;
        }
        if (signerFlag[_signer] != getSignerFlagFor(msg.sender)) {
            emit Error('Not your signer');
            return false;
        }
        delete signerFlag[_signer];
        emit SignerRemoved(msg.sender, _signer);
        return true;
    }

    function _confirm(bytes32 _opHash, address _consumer, address _signer) internal returns(bool) {
        if (!isSigner(_signer)) {
            emit Error('Signature by non-signer');
            return false;
        }
        if (isConfirmed(_opHash, _consumer, _signer)) {
            emit Error('Already confirmed');
            return true;
        }
        Operation storage op = operations[_consumer];
        uint8 newStatus = op.status;
        if (op.hash != bytes31(_opHash)) {
            op.hash = bytes31(_opHash);
            newStatus = signerFlag[_signer];
        } else {
            newStatus = newStatus | signerFlag[_signer];
        }
        op.status = newStatus;
        emit Confirmation(_opHash, _consumer, _signer, newStatus);
        return true;
    }

    function _parseSignature(bytes32 _hash, uint _nonce, address _consumer, uint8 _v, bytes32 _r, bytes32 _s) internal returns(address) {
        address signer = ecrecover(_hash, _v, _r, _s);
        if (signer == address(0)) {
            emit Error('Invalid signature');
            return address(0);
        }
        if (signerConsumerNonce[signer][_consumer] >= _nonce) {
            emit Error('Nonce already used');
            return address(0);
        }
        signerConsumerNonce[signer][_consumer] = _nonce;

        return signer;
    }

    // By user with provided signature.
    function confirm(bytes32 _opHash, address _consumer, uint _nonce, uint8 _v, bytes32 _r, bytes32 _s) public returns(bool) {
        bytes32 hash = keccak256(abi.encodePacked(_opHash, _consumer, address(this), _nonce));
        address signer = _parseSignature(hash, _nonce, _consumer, _v, _r, _s);

        if (signer == address(0)) {
            return false;
        }

        return _confirm(_opHash, _consumer, signer);
    }

    function confirmBySigner(bytes32 _opHash, address _consumer) public returns(bool) {
        return _confirm(_opHash, _consumer, msg.sender);
    }

    function confirmMany(
        bytes32[] memory _opHash,
        address[] memory _consumer,
        uint[] memory _nonce,
        uint8[] memory _v,
        bytes32[] memory _r,
        bytes32[] memory _s
    ) public returns(bool) {
        for (uint i = 0; i < _opHash.length; i++) {
            if (!confirm(_opHash[i], _consumer[i], _nonce[i], _v[i], _r[i], _s[i])) {
                return false;
            }
        }
        return true;
    }

    function isConfirmed(bytes32 _opHash, address _consumer, address _signer) public view returns(bool) {
        return (operations[_consumer].hash == bytes31(_opHash))
            && (operations[_consumer].status & signerFlag[_signer] > 0);
    }

    function getConfirmations(bytes32 _opHash, address _consumer) public view returns(uint8) {
        if (operations[_consumer].hash != bytes31(_opHash)) {
            return 0;
        }
        // If hash is already set then there is atleast 1 confirmation.
        return operations[_consumer].status == 3 ? 2 : 1;
    }

    function getOperation(address _consumer) public view returns(bytes31, uint8) {
        return (operations[_consumer].hash, operations[_consumer].status);
    }

    function _consumeOperation(bytes32 _opHash, address _consumer, uint _required) internal returns(bool) {
        if (getConfirmations(_opHash, _consumer) < _required) {
            emit Error('Not enough confirmations');
            return false;
        }
        operations[_consumer].hash = bytes31(uint248(1));
        emit Consumption(_opHash, _consumer);
        return true;
    }

    function consumeOperation(bytes32 _opHash, uint _required) public returns(bool) {
        return _consumeOperation(_opHash, msg.sender, _required);
    }
}
