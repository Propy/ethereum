pragma solidity 0.5.8;

import "./OwnedClonable.sol";

contract ProxyClonable is OwnedClonable {
    event EtherAccepted(address from, uint amount);

    function () external payable {
        if (msg.value != 0) {
            emit EtherAccepted(msg.sender, msg.value);
        }
    }

    function forward(
        address _destination,
        uint _value,
        bytes memory _data,
        bool _throwOnFailedCall
    ) public
        onlyContractOwner()
    {
        assembly {
            let res := call(div(mul(gas, 63), 64), _destination, _value, add(_data, 32), mload(_data), 0, 0)
            let returndatastart := msize()
            mstore(0x40, add(returndatastart, returndatasize))
            returndatacopy(returndatastart, 0, returndatasize)
            switch and(_throwOnFailedCall, iszero(res)) case 1 { revert(returndatastart, returndatasize) } default { return(returndatastart, returndatasize) }
        }
    }
}

