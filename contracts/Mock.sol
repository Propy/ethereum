pragma solidity 0.5.8;


/**
 * Contract that can be linked as an external dependency in the contract that is being tested..
 * It can:
 *   - Expect calls from certain address with certain data and value.
 *   - Increment calls count on expected calls, emit UnexpectedCall event on unexpected calls.
 *   - Ignore calls with certain function signatures, returning the default value.
 */
contract Mock {

    event Debug(bytes data);
    event UnexpectedCall(uint index, address from, uint value, bytes input, bytes32 callHash);

    struct Expect {
        bytes32 callHash;  // keccak256(from, value, data)
        bytes callReturn; // what to return
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

    mapping (bytes4 => bytes) public ignores;  // Function signature => ignored?

    // Fallback function catches all of the calls
    function () payable external {
        // Check if we are ignoring this function signature
        if (ignores[msg.sig].length != 0) {
            // Use assembly for return, since the fallback function can not use `return` statement
            bytes memory data = ignores[msg.sig];
            assembly {
                return(add(data, 32), mload(data))
            }
        }
        callsCount++;
        bytes32 callHash = keccak256(abi.encodePacked(msg.sender, msg.value, msg.data));
        if (expectations[nextExpectation].callHash != callHash) {
            emit UnexpectedCall(nextExpectation, msg.sender, msg.value, msg.data, callHash);
            return;
        }
        bytes memory result = expectations[nextExpectation++].callReturn;
        string memory temp = "throw";
        bytes memory compare = bytes(temp);
        if (result.length == compare.length) {
            for (uint8 i = 0; i < result.length; i++) {
                if (result[i] != compare[i]) {
                    break;
                }
                if (i == result.length - 1) {
                    revert();
                }
            }
        }
        assembly {
            return(add(result, 32), mload(result))
        }
    }

    function forwardCall(address _to, bytes memory _data) public payable returns(bytes32 result) {
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
    function ignore(bytes4 _sig, bytes memory _return) public returns(bytes memory) {
        ignores[_sig] = _return;
        return _return;
    }

    function unignore(bytes4 _sig) public {
        delete ignores[_sig];
    }

    function expect(address _from, uint _value, bytes memory _input, bytes memory _return) public {
        expectations[++expectationsCount] = Expect(keccak256(abi.encodePacked(_from, _value, _input)), _return);
    }

    function popExpectation() public {
        delete expectations[expectationsCount--];
    }

    function assertExpectations() public view {
        assert(expectationsLeft() == 0 && callsCount == expectationsCount);
    }

    function expectationsLeft() public view returns(uint) {
        return expectationsCount - (nextExpectation - 1);
    }

    function resetCallsCount() public returns(bool) {
        callsCount = 0;
    }
}

