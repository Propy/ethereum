pragma solidity 0.5.8;

import "./StorageAdapter.sol";
import "./AddressChecker.sol";
import './MultiEventsHistoryAdapter.sol';
import "./RolesLibraryAdapter.sol";


contract UsersRegistry is RolesLibraryAdapter, AddressChecker, StorageAdapter, MultiEventsHistoryAdapter {

    address public controller;

    StorageInterface.UIntBoolMapping roles;  // Mapping with all roles

    StorageInterface.AddressBytes32Mapping firstname;
    StorageInterface.AddressBytes32Mapping lastname;
    StorageInterface.AddressBytes32Mapping details;
    StorageInterface.AddressUIntMapping role;
    StorageInterface.AddressAddressMapping wallet;
    // address signature
    // bool verified

    /// EVENTS ///

    event RoleDefined(address self, uint role);
    event RoleRemoved(address self, uint role);

    event UserSet(address self, address user, bytes32 firstname, bytes32 lastname, bytes32 details, uint role, address wallet);
    event UserRemoved(address self, address user);
    event UserRoleSet(address self, uint role);


    /// MODIFIERS ///

    modifier onlyWithRole(address _user) {
        if (store.get(role, _user) != 0) {
            _;
        }
    }

    /// CONSTRUCTOR ///

    constructor(
        Storage _store,
        bytes32 _crate,
        address _controller,
        address _rolesLibrary
    ) StorageAdapter(_store, _crate) RolesLibraryAdapter(_rolesLibrary) public {
        assert(_controller != address(0));
        controller = _controller;

        roles.init("roles");

        firstname.init("firstname");
        lastname.init("lastname");
        details.init("details");
        role.init("role");
        wallet.init("wallet");
    }


    /// SETTINGS ///

    function setupEventsHistory(address _eventsHistory) auth public returns(bool) {
        if (getEventsHistory() != address(0)) {
            return false;
        }
        _setEventsHistory(_eventsHistory);
        return true;
    }

    function setController(address _controller)
        auth
        notNull(_controller)
        public
    returns(bool) {
        if (controller == _controller) {
            _emitError("Attempt to change to the same value");
            return false;
        }
        _emitServiceChanged("Controller", controller, _controller);
        controller = _controller;
        return true;
    }



    /// MAIN FUNCTIONS ///

    function defineRole(uint _role) public auth returns(bool) {
        store.set(roles, _role, true);
        _emitRoleDefined(_role);
        return true;
    }

    function create(
        address _user, bytes32 _firstname, bytes32 _lastname,
        bytes32 _details, uint _role, address _wallet
    )
        public
        auth
    returns(bool) {
        require(store.get(role, _user) == 0);  // User must not exist to be created
        return _set(_user, _firstname, _lastname, _details, _role, _wallet);
    }


    function update(
        address _user, bytes32 _firstname, bytes32 _lastname,
        bytes32 _details, uint _role, address _wallet
    )
        public
        auth
    returns(bool) {
        require(store.get(role, _user) != 0);  // User must exist to be updated
        return _set(_user, _firstname, _lastname, _details, _role, _wallet);
    }


    function _set(
        address _user, bytes32 _firstname, bytes32 _lastname,
        bytes32 _details, uint _role, address _wallet
    )
        internal
    returns(bool) {
        require(
            _user != address(0) &&
            _firstname.length != 0 &&
            _lastname.length != 0 &&
            _role != 0 &&
            store.get(roles, _role) &&
            _wallet != address(0)
        );
        store.set(firstname, _user, _firstname);
        store.set(lastname, _user, _lastname);
        store.set(details, _user, _details);
        store.set(role, _user, _role);
        store.set(wallet, _user, _wallet);
        _emitUserSet(_user, _firstname, _lastname, _details, _role, _wallet);
        return true;
    }

    function remove(address _user) public auth returns(bool) {
        store.set(firstname, _user, "");
        store.set(lastname, _user, "");
        store.set(details, _user, "");
        store.set(role, _user, 0);
        store.set(wallet, _user, address(0));
        _emitUserRemoved(_user);
        return true;
    }



    /// GETTERS ///

    function roleExists(uint _role) public view returns(bool) {
        return store.get(roles, _role);
    }

    function getUser(address _user)
        public
        view
        onlyWithRole(_user)
    returns(bytes32, bytes32, uint, address) {
        return (
            store.get(firstname, _user),
            store.get(lastname, _user),
            store.get(role, _user),
            store.get(wallet, _user)
        );
    }

    function getMe()
        public
        view
    returns(bytes32, bytes32, uint, address) {
        return getUser(msg.sender);
    }

    function getWallet(address _user) public view onlyWithRole(_user) returns(address) {
        return store.get(wallet, _user);
    }

    function getUserRole(address _user) public view returns(uint) {
        return store.get(role, _user);
    }

    function hasRole(address _user, uint _role) public view returns(bool) {
        return store.get(role, _user) == _role;
    }


    /// MULTI EVENTS HISTORY ///

    function _emitRoleDefined(uint _role) internal {
        UsersRegistry(getEventsHistory()).emitRoleDefined(_role);
    }

    function _emitRoleRemoved(uint _role) internal {
        UsersRegistry(getEventsHistory()).emitRoleRemoved(_role);
    }

    function _emitUserSet(
        address _user,
        bytes32 _firstname,
        bytes32 _lastname,
        bytes32 _details,
        uint _role,
        address _wallet
    )
        internal {
            UsersRegistry(getEventsHistory()).emitUserSet(
                _user,
                _firstname,
                _lastname,
                _details,
                _role,
                _wallet
            );
    }

    function _emitUserRemoved(address _user) internal {
        UsersRegistry(getEventsHistory()).emitUserRemoved(_user);
    }

    function _emitUserRoleSet(uint _role) public {
        UsersRegistry(getEventsHistory()).emitUserRoleSet(_role);
    }

    function emitRoleDefined(uint _role) public {
        emit RoleDefined(_self(), _role);
    }

    function emitRoleRemoved(uint _role) public {
        emit RoleRemoved(_self(), _role);
    }

    function emitUserSet(
        address _user,
        bytes32 _firstname,
        bytes32 _lastname,
        bytes32 _details,
        uint _role,
        address _wallet
    ) public {
        emit UserSet(
            _self(),
            _user,
            _firstname,
            _lastname,
            _details,
            _role,
            _wallet);
    }

    function emitUserRemoved(address _user) public {
        emit UserRemoved(_self(), _user);
    }

    function emitUserRoleSet(uint _role) public {
        emit UserRoleSet(_self(), _role);
    }


    /// RESTRICTIONS & DISASTER RECOVERY ///

    function kill() auth public {
        selfdestruct(msg.sender);
    }

    // FIXME: Add maintenance mode

}
