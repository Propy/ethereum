pragma solidity 0.4.24;

import "../base/Owned.sol";


contract ControllerInterface {
    function usersRegistry() public constant returns(address);
}

contract UsersRegistryInterface {
    function roleExists(uint) public constant returns(bool);
}

/**
 * Meta deed is an inheritable contract that implements a storage of some
 * typical workflow, that we don't want to duplicate for each deed contract
 * of particular type, say, for some jurisdiction.
 *
 * Assume we need to implement a deed for some jurisdiction.
 * Then we create a contract called MetaDeedOfSomeCountry.sol,
 * and it inherits all of the stuff from MetaDeed.
 * Then, in its constructor, we define all of the `Moves`, `roles` and so on.
 *
 * See MetaDeedUkraine. for details.
 *
 * We do so to minimize deployment gas costs, since storage space is expensive.
 */
contract MetaDeed is Owned {

    address public controller;
    uint[] public intermediaries;

    struct Move {
        string name;
        uint party;  // Party required to act
        uint role; // Role that `party` must have to do this move
        uint8 args;  // Number of args required
        uint8 dependency;  // The `Move` this `Move` depends on

        uint receiver;  // Pay this party on move success
        uint returnTo;  // Return to this party if move fails
        uint8 unlockPaymentAt;  // Binds to the pending payment. Withdraw can be done once `unlockPaymentAt` `Move` is `.done`

        bool isFinal;  // If move is final, approve or reject ownership transfer, based on move status.
    }
    // FIXME: Add ability to add, update and remove moves (omg MLG xXx /o_o\)
    mapping (uint8 => Move) public moves;

    // TODO
    uint public movesCount;

    // List of moves on which we must accept some payment.
    uint8[] public paymentMoves;


    event MoveAdded(uint8 move, string name, uint party, uint8 args, uint8 dependency, uint8 assignPaymentFor, uint8 unlockPaymentAt);

    // TODO: Don't forget to initiate this constructor in the child contract
    constructor(address _controller) {
        controller = _controller;
    }

    function setController(address _controller) public
        onlyContractOwner
    returns(bool) {
        if (_controller == address(0) || controller == _controller) {
            return false;
        }
        controller = _controller;
        return true;
    }

    function getMoveName(uint8 _move) public constant returns(string) {
        return moves[_move].name;
    }

    function getMoveInfo(uint8 _move) public constant returns(uint, uint, uint8, uint8, uint, uint, uint8, bool) {
        Move storage move = moves[_move];
        return (
            move.party,
            move.role,
            move.args,
            move.dependency,
            move.receiver,
            move.returnTo,
            move.unlockPaymentAt,
            move.isFinal
        );
    }

    function getIntermediariesCount() public constant returns(uint) {
        return intermediaries.length;
    }

    function getPaymentMovesCount() public constant returns(uint) {
        return paymentMoves.length;
    }

    function roleExists(address _controller, uint _role) internal returns(bool) {
        ControllerInterface Controller = ControllerInterface(_controller);
        address usersRegistry = Controller.usersRegistry();
        UsersRegistryInterface UsersRegistry = UsersRegistryInterface(usersRegistry);
        return UsersRegistry.roleExists(_role);
    }

    /*
    function _emitMoves(uint8 _lastMove) internal {
        // Emit events about all moves
        for (uint8 m = 1; m <= _lastMove; m++) {
            MoveAdded(
                m,
                moves[m].name,
                moves[m].party,
                moves[m].args,
                moves[m].payment,
                moves[m].assignPaymentFor,
                moves[m].unlockPaymentAt
            );
            for (uint8 d = 0; d < moves[m].dependencies.length; d++) {
                MoveDependencyAdded(m, moves[m].dependencies[d]);
            }
        }
    }
    */

}
