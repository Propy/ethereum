pragma solidity 0.4.23;

import "../utility/Storage.sol";
import "../utility/StorageInterface.sol";


contract StorageAdapter {
    using StorageInterface for *;

    StorageInterface.Config store;

    function StorageAdapter(Storage _store, bytes32 _crate) {
        assert(_crate != bytes32(0));
        store.init(_store, _crate);
    }
}
