pragma solidity 0.4.18;


/**
 * Contract that can be linked as an external dependency in the contract that is being tested..
 * It can:
 *   - Expect calls from certain address with certain data and value.
 *   - Increment calls count on expected calls, emit UnexpectedCall event on unexpected calls.
 *   - Ignore calls with certain function signatures, returning the default value.
 */
contract Mock {

    event Debug(bytes32 data);
    event UnexpectedCall(uint index, address from, uint value, bytes input, bytes32 callHash);

    struct Expect {
        bytes32 callHash;  // keccak256(from, value, data)
        bytes32 callReturn; // what to return
    }

    uint public expectationsCount;  // Increments with each `Expect`ation created
    uint public callsCount;  // Increments on each call
    uint public nextExpectation = 1;  // Increments on each `Expect`ed call

    mapping (uint => Expect) public expectations;
    /*
      If you want to check that your contract calling all the external
      dependencies correctly, create required expectations, perform the call to
      your contract, then call the `assertExpectations()` to check if all went fine.
    */

    mapping (bytes4 => bytes32) public ignores;  // Function signature => ignored?

    // Fallback function catches all of the calls
    function () payable {
        // Check if we are ignoring this function signature
        if (ignores[msg.sig] != bytes32(0)) {
            // Use assembly for return, since the fallback function can not use `return` statement
            bytes32 data = ignores[msg.sig];
            assembly {
                mstore(0, data)  // Just return `1`. Or, to be more accurate, "0x1000000000000000000000000000000000000000000000000000000000000000"
                return(0, 32)
            }
        }
        callsCount++;
        bytes32 callHash = keccak256(msg.sender, msg.value, msg.data);
        if (expectations[nextExpectation].callHash != callHash) {
            UnexpectedCall(nextExpectation, msg.sender, msg.value, msg.data, callHash);
            return;
        }
        bytes32 result = expectations[nextExpectation++].callReturn;
        if (result == bytes32("throw")) {
            revert();
        }
        assembly {
            mstore(0, result)
            return(0, 32)
        }
    }

    function forwardCall(address _to, bytes _data) returns(bytes32 result) {
        uint value = msg.value;
        bool success;
        assembly {
            success := call(
                div(mul(gas, 63), 64),
                _to,
                value,
                add(_data, 32),
                mload(_data),
                0, 32
            )
            result := mload(0)
        }
        require(success);
    }

    /**
     * Enable or disable the ignore of the given function signature.
     */
    function ignore(bytes4 _sig, bytes32 _return) {
        ignores[_sig] = _return;
    }

    function expect(address _from, uint _value, bytes _input, bytes32 _return) {
        expectations[++expectationsCount] = Expect(keccak256(_from, _value, _input), _return);
    }

    function popExpectation() {
        expectations[expectationsCount--] = Expect(bytes32(0), bytes32(0));
    }

    function assertExpectations() constant {
        assert(expectationsLeft() == 0 && callsCount == expectationsCount);
    }

    function expectationsLeft() constant returns(uint) {
        return expectationsCount - (nextExpectation - 1);
    }

    function resetCallsCount() returns(bool) {
        callsCount = 0;
    }
}
