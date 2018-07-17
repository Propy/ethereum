<<<<<<< HEAD
pragma solidity 0.4.24;
=======
pragma solidity 0.4.23;
>>>>>>> master

contract ProxyFactory {
    event ProxyDeployed(address proxyAddress, address targetAddress);
    event ProxiesDeployed(address[] proxyAddresses, address targetAddress);

    function createManyProxies(uint256 _count, address _target, bytes _data)
        public
    {
        address[] memory proxyAddresses = new address[](_count);

        for (uint256 i = 0; i < _count; ++i) {
            proxyAddresses[i] = createProxyImpl(_target, _data);
        }

        emit ProxiesDeployed(proxyAddresses, _target);
    }

    function createProxy(address _target, bytes _data)
        public
        returns (address proxyContract)
    {
        proxyContract = createProxyImpl(_target, _data);

        emit ProxyDeployed(proxyContract, _target);
    }
    
    function createProxyImpl(address _target, bytes _data)
        internal
        returns (address proxyContract)
    {
        assembly {
            let contractCode := mload(0x40) // Find empty storage location using "free memory pointer"
           
            mstore(add(contractCode, 0x0b), _target) // Add target address, with a 11 bytes [i.e. 23 - (32 - 20)] offset to later accomodate first part of the bytecode
            mstore(sub(contractCode, 0x09), 0x000000000000000000603160008181600b9039f3600080808080368092803773) // First part of the bytecode, shifted left by 9 bytes, overwrites left padding of target address
            mstore(add(contractCode, 0x2b), 0x5af43d828181803e808314602f57f35bfd000000000000000000000000000000) // Final part of bytecode, offset by 43 bytes

            proxyContract := create(0, contractCode, 60) // total length 60 bytes
            if iszero(extcodesize(proxyContract)) {
                revert(0, 0)
            }
           
            // check if the _data.length > 0 and if it is forward it to the newly created contract
            let dataLength := mload(_data) 
            if iszero(iszero(dataLength)) {
                if iszero(call(gas, proxyContract, 0, add(_data, 0x20), dataLength, 0, 0)) {
                    revert(0, 0)
                }
            }
        }
    }
}

/***
* 
* PROXY contract (bytecode)

603160008181600b9039f3600080808080368092803773f00df00df00df00df00df00df00df00df00df00d5af43d828181803e808314602f57f35bfd

* 
* PROXY contract (opcodes)

0 PUSH1 0x31
2 PUSH1 0x00
4 DUP2
5 DUP2
6 PUSH1 0x0b
8 SWAP1
9 CODECOPY
10 RETURN
11 PUSH1 0x00
13 DUP1
14 DUP1
15 DUP1
16 DUP1
17 CALLDATASIZE
18 DUP1
19 SWAP3
20 DUP1
21 CALLDATACOPY
22 PUSH20 0xf00df00df00df00df00df00df00df00df00df00d
43 GAS
44 DELEGATECALL
45 RETURNDATASIZE
46 DUP3
47 DUP2
48 DUP2
49 DUP1
50 RETURNDATACOPY
51 DUP1
52 DUP4
53 EQ
54 PUSH1 0x2f
56 JUMPI
57 RETURN
58 JUMPDEST
59 REVERT

* 
***/