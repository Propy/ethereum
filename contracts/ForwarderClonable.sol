pragma solidity 0.5.8;

contract CosignerInterface {
    function confirm(bytes32 _opHash, address _consumer, uint _nonce, uint8 _v, bytes32 _r, bytes32 _s) public returns(bool);
    function consumeOperation(bytes32 _opHash, uint _required) public returns(bool);
}

contract ProxyInterface {
    function forward(address _destination, uint _value, bytes memory _data, bool _throwOnFailedCall) public;
    function changeContractOwnership(address _to) public returns(bool);
    function claimContractOwnership() public returns(bool);
    function forceChangeContractOwnership(address _to) public returns(bool);
}

contract ForwarderClonable {
    ProxyInterface public proxy;
    CosignerInterface public cosigner;
    address public contractOwner;
    bool public doNotAlwaysRequireCosignature;
    uint88 internal lastUsedNonce;
    uint8 constant MINIMUM_REQUIRED = 1;
    uint8 constant MAXIMUM_REQUIRED = 2;

    event OwnershipChanged(address newOwner);
    event Cosigner(address cosignerAddress);
    event SecureMode(bool enabled);
    event Error(bytes32 message);
    
    // Prototype lock.
    constructor () public {
        construct(0x0000000000000000000000000000000000000001, 0x0000000000000000000000000000000000000001);
        init(0x0000000000000000000000000000000000000001);
    }

    function construct(address _proxy, address _cosigner) public {
        require(contractOwner == address(0));
        contractOwner = msg.sender;
        proxy = ProxyInterface(_proxy);
        cosigner = CosignerInterface(_cosigner);
    }

    function init(address _to) onlyGranted() public {
        require(lastUsedNonce == 0);
        contractOwner = _to;
        lastUsedNonce = 1;
    }

    function initInsecure(address _to) public {
        init(_to);
        doNotAlwaysRequireCosignature = true;
    }

    function granted(address _to) public view returns(bool) {
        return contractOwner == _to;
    }

    function alwaysRequireCosignature() public view returns(bool) {
        return !doNotAlwaysRequireCosignature;
    }

    function lastNonce() public view returns(uint) {
        return uint(lastUsedNonce);
    }

    function nextNonce() public view returns(uint) {
        return uint(lastUsedNonce) + 1;
    }

    function isCosignerSet() public view returns(bool) {
        return address(cosigner) != address(0);
    }

    modifier checkSigned(uint8 _required) {
        if (doNotAlwaysRequireCosignature || _checkSigned(cosigner, _required)) {
            _;
        } else {
            _error('Cosigner: access denied');
        }
    }

    modifier checkSignedStrict(uint8 _required) {
        if (_checkSigned(cosigner, _required)) {
            _;
        } else {
            _error('Cosigner: access denied');
        }
    }

    modifier hasCosigner() {
        if (isCosignerSet()) {
            _;
        } else {
            _error('Cosigner not set');
        }
    }

    modifier onlyGranted() {
        if (granted(msg.sender) || (address(this) == msg.sender)) {
            _;
        } else {
            _error('Access denied');
        }
    }

    modifier checkSigner(bytes32 _hash, uint _nonce, uint8 _v, bytes32 _r, bytes32 _s) {
        bytes32 prefixedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash));
        address signer = ecrecover(prefixedHash, _v, _r, _s);
        
        if (signer == address(0)) {
            _error('Invalid signature');
            return;
        }
        if (_nonce <= lastNonce()) {
            _error('Invalid nonce');
            return;
        }
        if (!granted(signer)) {
            _error('Access denied');
            return;
        }
        lastUsedNonce = uint88(_nonce);
        _;
    }

    function enableSecureMode() public onlyGranted() checkSigned(MINIMUM_REQUIRED) returns(bool) {
        _setSecureMode(true);
        return true;
    }

    function disableSecureMode() public onlyGranted() checkSigned(MINIMUM_REQUIRED) returns(bool) {
        _setSecureMode(false);
        return true;
    }

    function _setSecureMode(bool _enabled) internal {
        doNotAlwaysRequireCosignature = !_enabled;
        emit SecureMode(_enabled);
    }

    function setCosignerAddress(CosignerInterface _cosigner) public onlyGranted() checkSignedStrict(MINIMUM_REQUIRED) returns(bool) {
        if (!_checkSigned(_cosigner, MAXIMUM_REQUIRED)) {
            _error('Invalid cosigner');
            return false;
        }
        cosigner = _cosigner;
        emit Cosigner(address(cosigner));
        return true;
    }

    function changeContractOwnership(address _to) public onlyGranted() checkSignedStrict(MINIMUM_REQUIRED) returns(bool) {
        return proxy.changeContractOwnership(_to);
    }

    function claimContractOwnership() onlyGranted() public checkSignedStrict(MINIMUM_REQUIRED) returns(bool) {
        return proxy.claimContractOwnership();
    }

    function forceChangeContractOwnership(address _to) public onlyGranted() checkSignedStrict(MINIMUM_REQUIRED) returns(bool) {
        return proxy.forceChangeContractOwnership(_to);
    }

    function forwardOnBehalf(
        address _destination,
        uint _value,
        bytes memory _data,
        uint _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public
        checkSigner(keccak256(abi.encodePacked(_destination, _value, _data, address(this), _nonce)), _nonce, _v, _r, _s)
    {
        this.forward(_destination, _value, _data);
        _returnData();
    }

    function actOnBehalf(
        bytes memory _data,
        uint _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public
        checkSigner(keccak256(abi.encodePacked(_data, address(this), _nonce)), _nonce, _v, _r, _s)
    {
        _callResult(address(this), 0, _data);
    }

    function confirmAndForward(
        address _destination,
        uint _value,
        bytes memory _data,
        bytes32 _opHash,
        uint _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public
        onlyGranted()
    {
        cosigner.confirm(_opHash, address(this), _nonce, _v, _r, _s);
        this.forward(_destination, _value, _data);
        _returnData();
    }

    function confirmAndForwardOnBehalf(
        address _destination,
        uint _value,
        bytes memory _data,
        bytes32 _opHash,
        uint[2] memory _nonce,
        uint8[2] memory _v,
        bytes32[2] memory _r,
        bytes32[2] memory _s
    ) public
    {
        cosigner.confirm(_opHash, address(this), _nonce[0], _v[0], _r[0], _s[0]);
        forwardOnBehalf(_destination, _value, _data, _nonce[1], _v[1], _r[1], _s[1]);
    }

    function forward(address _destination, uint _value, bytes memory _data) public
        onlyGranted()
        checkSigned(MINIMUM_REQUIRED)
    {
        proxy.forward(_destination, _value, _data, false);
        _returnData();
    }

    function recover(address _from, address _to) hasCosigner() checkSignedStrict(MAXIMUM_REQUIRED) public returns(bool) {
        if (!granted(_from)) {
            _error('Must recover from owner');
            return false;
        }
        _setContractOwner(_to);
        return true;
    }

    function _setContractOwner(address _to) internal {
        contractOwner = _to;
        emit OwnershipChanged(_to);
    }

    function _error(bytes32 _message) internal {
        emit Error(_message);
    }

    function _checkSigned(CosignerInterface _cosigner, uint8 _required) internal returns(bool) {
        return (address(_cosigner) == address(0)) || _cosigner.consumeOperation(keccak256(msg.data), _required);
    }

    function _callResult(address _destination, uint _value, bytes memory _data) internal {
        assembly {
            let res := call(div(mul(gas, 63), 64), _destination, _value, add(_data, 32), mload(_data), 0, 0)
            let returndatastart := msize()
            mstore(0x40, add(returndatastart, returndatasize))
            returndatacopy(returndatastart, 0, returndatasize)
            switch res case 0 { revert(returndatastart, returndatasize) } default { return(returndatastart, returndatasize) }
        }
    }

    function _returnData() pure internal {
        assembly {
            let returndatastart := msize()
            mstore(0x40, add(returndatastart, returndatasize))
            returndatacopy(returndatastart, 0, returndatasize)
            return(returndatastart, returndatasize)
        }
    }
}
