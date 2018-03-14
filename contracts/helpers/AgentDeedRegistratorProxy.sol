pragma solidity ^0.4.18;
import "../base/Owned.sol";

contract AgentDeedRegistratorProxy is Owned {

    address public agentDeedRegistrator;

    function () payable {
        address target = _target();
        assembly {
            // Specify start point of free memory that will be used as a temporary
            // storage for arguments to `delegatecall`, `revert` and `return`.
            // Memory before that pointer is already allocated.
            let freememstart := msize()

            // Copy calldata to memory
            calldatacopy(freememstart, 0, calldatasize())

            let result := delegatecall(
                div(mul(gas, 63), 64), // `gas`
                target,                // `receiver`
                freememstart,          // `in`, point in memory to get data from
                calldatasize(),        // `insize`, how many bytes of data from memory to get
                0,                     // `out`, point in memory to write returned data to
                0                      // `outsize`, how many bytes of data write.
                // We do not load return data automatically, since we don't know what will actually return
            )
            // Instead, we load return data dynamically, based on `returndatasize`
            returndatacopy(freememstart, 0, returndatasize())

            // `result` will equal `0` in case of exception in the target contract
            // if iszero(result) {
            //     revert(freememstart, returndatasize())
            // }
            return(freememstart, returndatasize())
        }
    }

    function AgentDeedRegistratorProxy(address _agentContract) public {
        agentDeedRegistrator = _agentContract;
    }

    function setAgentDeedRegistrator(address _agentContract) public onlyContractOwner {
        agentDeedRegistrator = _agentContract;
    }

    // Must be overriden in clonable children
    function _target() internal returns(address) {
        return agentDeedRegistrator;
    }
}