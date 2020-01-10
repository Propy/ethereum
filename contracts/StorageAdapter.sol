pragma solidity 0.5.8;

import "./StorageInterface.sol";


contract StorageAdapter {
    using StorageInterface for *;

    StorageInterface.Config store;

    constructor(Storage _store, bytes32 _crate) public {
        assert(_crate != bytes32(0));
        store.init(_store, _crate);
    }
}