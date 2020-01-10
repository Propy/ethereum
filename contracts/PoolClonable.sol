pragma solidity 0.5.8;

import "./ProxyClonable.sol";
import "./ForwarderClonable.sol";
import "./RolesLibraryInterface.sol";


contract PoolClonable {
    address public constant defaultCosigner = 0x3231231231231231231231231231231231231233;
    address public constant forwarderClonable = 0x1231231231231231231231231231231231231231;
    address public constant proxyClonable = 0x2231231231231231231231231231231231231232;

    RolesLibraryInterface rolesLibrary;
    modifier auth() {
        if (!_isAuthorized(msg.sender, msg.sig)) {
            return;
        }
        _;
    }
    function _isAuthorized(address _src, bytes4 _sig) view internal returns(bool) {
        if (_src == address(this)) {
            return true;
        }
        if (address(rolesLibrary) == address(0)) {
            return false;
        }
        return rolesLibrary.canCall(_src, address(this), _sig);
    }

    constructor (address _rolesLibrary) public {
        rolesLibrary = RolesLibraryInterface(_rolesLibrary);
    }


    event Deployed(address contractAddress, address proxyAddress);
    event Assigned(address contractAddress, address indexed forwarderAddress);

    function _deployProxyClone() internal returns(address) {
        return _deploy(proxyClonable);
    }

    function _deployForwarderClone() internal returns(address) {
        return _deploy(forwarderClonable);
    }

    // 0000000000000000000000000000000000000000 - placeholder of clone's prototype constant.
    // There is 54 bytes to the left. So when the bytecode for the clone contract is loaded into memory the layout is as follows:
    // 32 bytes of lengthOfTheBytecode, then first 54 bytes of bytecode, then 20 bytes of placeholder, then the rest of the bytecode.
    // ...|00000000000000000000000000000000000000000000000000000000000000e6|54 bytes of bytecode|0000000000000000000000000000000000000000|...
    function _deploy(address _clonable) internal returns(address result) {
        // Bytecode is pasted here manually without the trailing 43 bytes of metadata. Remember to update bytecode length marker.
        bytes memory scaffold = hex'60606040523415600e57600080fd5b5b60568061001d6000396000f30060606040525b5b59368101604052366000823760008036837300000000000000000000000000000000000000006040603f5a0204f4593d81016040523d6000823e818015604a573d82f35b3d82fd5b505050505b0000';
        bytes32 shiftedAddress = bytes32(uint256(_clonable) << 96);
        assembly {
            // Reading 32 bytes of bytecode skipping the 32 bytes length cell and 54 bytes of code before marker.
            let placeholder := mload(add(scaffold, 86))
            // placeholder is 0000000000000000000000000000000000000000************************
            let replace := or(shiftedAddress, placeholder)
            // replace is     clonableAddressClonableAddressClonableAd************************
            mstore(add(scaffold, 86), replace)
            result := create(0, add(scaffold, 32), mload(scaffold))
        }
    }

    function deploy() public returns(bool) {
        return deployWithCosigner(address(0));
    }

    function deployWithCosigner(address _cosigner)  public returns(bool) {
        if (_cosigner == address(0)) {
            return deployWithoutDefaultCosigner();
        }
        if (_cosigner == defaultCosigner) {
            return deployWithDefaultCosigner();
        }
        return deployWithUnusualCosigner(_cosigner);
    }

    function deployWithUnusualCosigner(address _cosigner) public auth returns(bool) {
        require(_cosigner != address(0));
        require(_cosigner != defaultCosigner);
        address proxyAddress = _deployProxyClone();
        address forwarderAddress = _deployForwarderClone();
        ProxyClonable(address(uint160(proxyAddress))).construct(forwarderAddress);
        ForwarderClonable(forwarderAddress).construct(proxyAddress, _cosigner);
        emit Deployed(forwarderAddress, proxyAddress);
        return true;
    }

    function deployWithDefaultCosigner() public auth returns(bool) {
        address proxyAddress = _deployProxyClone();
        address forwarderAddress = _deployForwarderClone();
        ProxyClonable(address(uint160(proxyAddress))).construct(forwarderAddress);
        ForwarderClonable(forwarderAddress).construct(proxyAddress, defaultCosigner);
        emit Deployed(forwarderAddress, proxyAddress);
        return true;
    }

    function deployWithoutDefaultCosigner() public auth returns(bool) {
        address proxyAddress = _deployProxyClone();
        address forwarderAddress = _deployForwarderClone();
        ProxyClonable(address(uint160(proxyAddress))).construct(forwarderAddress);
        ForwarderClonable(forwarderAddress).construct(proxyAddress, address(0));
        emit Deployed(forwarderAddress, proxyAddress);
        return true;
    }
    
    function assignTo(ForwarderClonable _forwarderClone, address _forwarderAddress, bool _alwaysRequireCosignature) public auth returns(bool) {
        if (!_alwaysRequireCosignature) {
            _forwarderClone.initInsecure(_forwarderAddress);
        } else {
            _forwarderClone.init(_forwarderAddress);
        }
        emit Assigned(address(_forwarderClone), _forwarderAddress);
        return true;
    }

    function assignToSecure(ForwarderClonable _forwarderClone, address _forwarderAddress) public auth returns(bool) {
        _forwarderClone.init(_forwarderAddress);
        emit Assigned(address(_forwarderClone), _forwarderAddress);
        return true;
    }
}

