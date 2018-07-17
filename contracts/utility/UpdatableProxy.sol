pragma solidity 0.4.24;

contract UpdatableProxy {

    constructor(address _addr) public {
        assembly {
            sstore(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE, caller)
            sstore(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF, _addr)
        }
    }

    function s_impl(address _addr) public {
        assembly {
            if iszero(eq(sload(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE), caller)) {
                revert(0, 0)
            }
            sstore(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF, _addr)
        }
    }

    function l_impl() public view returns(address _impl) {
        assembly {
            _impl := sload(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
        }
    }

    function () public payable {
        assembly {
            let freememstart := msize()
            calldatacopy(freememstart, 0, calldatasize)
            let res := delegatecall(and(gas,0xEFFFFFFF), and(sload(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF),0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF), freememstart, calldatasize, 0, 0)
            returndatacopy(freememstart, 0, returndatasize)
            if iszero(res) { revert(freememstart, returndatasize) }
            return(freememstart, returndatasize)
        }
    }

}
