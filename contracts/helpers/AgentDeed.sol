pragma solidity 0.4.24;

import "../base/Owned.sol";

contract DeedInterface {
    function price() public view returns(uint256);
    function document() public view returns(address);
    function property() public view returns(address);
}

contract ControllerInterface {
    function token() public constant returns(address);
    function usersRegistry() public constant returns(address);

    function registerDeed(address _deed) public returns(bool);
    function registerProperty(address _property) public returns(bool);

    function companyWallet() public constant returns(address);
    function networkGrowthPoolWallet() public constant returns(address);
}

contract FeeCalcInterface {
    function getFee() public constant returns(uint256);
    function getCompanyFee() public constant returns(uint256);
    function getNetworkGrowthFee() public constant returns(uint256);
}

contract ERC20Interface {
    function allowance(address owner, address spender) public constant returns (uint256);
    function transferFrom(address from, address to, uint256 value) public returns (bool);
    function approve(address spender, uint256 value) public returns (bool);
    function balanceOf(address who) public constant returns (uint256);
    function transfer(address to, uint256 value) public returns (bool);
    function totalSupply() public constant returns(uint256);
    function decimals() public constant returns(uint8);
}

contract UsersRegistryInterface {
    function create(
        address _user, bytes32 _firstname, bytes32 _lastname,
        bytes32 _details, uint _role, address _wallet
    )
        public
    returns(bool);
    function getUserRole(address) public constant returns(uint);
}

contract DocumentRegistryInterface {
    function register(address) public;
    function feeCalc() public constant returns(address);
}

contract AgentDeed is Owned {

    ControllerInterface public controller;
    DocumentRegistryInterface public documentRegistry;
    string public name;

    event Error(string msg);

    modifier onlyRegisteredUser() {
        uint256 code = 0;
        address _sender = msg.sender;
        assembly {
            code := extcodesize(_sender)
        }
        if(code != 0) {
            _sender = Owned(_sender).contractOwner(); // Proxy
            _sender = Owned(_sender).contractOwner(); // Forwarder
        }
        if (
            UsersRegistryInterface(controller.usersRegistry()).getUserRole(_sender) != 0 ||
            UsersRegistryInterface(controller.usersRegistry()).getUserRole(msg.sender) != 0
        ) {
            _;
        }
        else {
            emit Error("User does not registered");
        }
    }

    constructor(address _controller, address _documentRegistry) public {
        controller = ControllerInterface(_controller);
        documentRegistry = DocumentRegistryInterface(_documentRegistry);
    }

    function setController(address _controller) public onlyContractOwner {
        controller = ControllerInterface(_controller);
    }

    function setDocumentRegistry(address _documentRegistry) public onlyContractOwner {
        documentRegistry = DocumentRegistryInterface(_documentRegistry);
    }

    function setName(string _name) public onlyContractOwner {
        name = _name;
    }

    function register(address _deed) public onlyRegisteredUser {
        DeedInterface deed = DeedInterface(_deed);
        FeeCalcInterface feeCalc = FeeCalcInterface(documentRegistry.feeCalc());

        controller.registerDeed(address(deed));
        controller.registerProperty(deed.property());
        documentRegistry.register(deed.document());

        // Transfer fee to company wallet
        address companyWallet = controller.companyWallet();
        assert(companyWallet != address(0));
        uint256 companyFee = feeCalc.getCompanyFee();
        assert(ERC20Interface(controller.token()).transfer(companyWallet, companyFee));

        // Transfer fee to network wallet
        address networkGrowthPoolWallet = controller.networkGrowthPoolWallet();
        assert(networkGrowthPoolWallet != address(0));
        uint256 networkGrowthFee = feeCalc.getNetworkGrowthFee();
        assert(ERC20Interface(controller.token()).transfer(networkGrowthPoolWallet, networkGrowthFee));
    }

}