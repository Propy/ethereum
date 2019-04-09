pragma solidity 0.4.24;

import '../adapters/RolesLibraryAdapter.sol';

/**
 * @title Events History universal multi contract.
 *
 * Contract serves as an Events storage for any type of contracts.
 * Events appear on this contract address but their definitions provided by calling contracts.
 *
 * Note: all the non constant functions return false instead of throwing in case if state change
 * didn't happen yet.
 */
contract MultiEventsHistory is RolesLibraryAdapter {
    // Authorized calling contracts.
    mapping(address => bool) public isAuthorized;

    constructor(address _rolesLibrary) RolesLibraryAdapter(_rolesLibrary) public {}

    /**
     * Authorize new caller contract.
     *
     * @param _caller address of the new caller.
     *
     * @return success.
     */
    function authorize(address _caller) auth public returns(bool) {
        if (isAuthorized[_caller]) {
            return false;
        }
        isAuthorized[_caller] = true;
        return true;
    }

    /**
     * Event emitting fallback.
     *
     * Can be and only called by authorized caller.
     * Delegate calls back with provided msg.data to emit an event.
     *
     * Throws if call failed.
     */
    function () public {
        if (!isAuthorized[msg.sender]) {
            return;
        }
        // Internal Out Of Gas/Throw: revert this transaction too;
        // Recursive Call: safe, all changes already made.
        if (!msg.sender.delegatecall(msg.data)) {
            revert();
        }
    }
}
