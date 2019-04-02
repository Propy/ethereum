pragma solidity 0.4.24;

import "../utility/Storage.sol";
import "../utility/StorageInterface.sol";


contract StorageAdapter {
    using StorageInterface for *;

    StorageInterface.Config store;

    constructor(Storage _store, bytes32 _crate) public {
        assert(_crate != bytes32(0));
        store.init(_store, _crate);
    }
}
