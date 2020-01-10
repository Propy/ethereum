pragma solidity ^0.5.8;

import "./Ownable.sol";

contract FeeCalcInterface {
    function getFee() public view returns(uint256);
    function getCompanyFee() public view returns(uint256);
    function getNetworkGrowthFee() public view returns(uint256);
}

contract ERC20Interface {
    function transfer(address, uint256) public returns (bool);
}

contract DocumentRegistryInterface {
    function register(address) public;
    function feeCalc() public view returns(address);

    function companyWallet() public view returns(address);
    function networkGrowthPoolWallet() public view returns(address);
    function token() public view returns(address);
}

contract Agent is Ownable {

    DocumentRegistryInterface public documentRegistry;
    string public name;

    address public user;

    event Error(string msg);

    modifier onlyRegisteredUser() {
        uint256 code = 0;
        address _sender = msg.sender;
        if (_sender == user) {
            _;
        }
        else {
            emit Error("User does not registered");
        }
    }

    constructor(address _documentRegistry, address _owner, address _user) public {
        documentRegistry = DocumentRegistryInterface(_documentRegistry);
        owner = _owner;
        user = _user;
    }

    function setDocumentRegistry(address _documentRegistry) public onlyOwner {
        documentRegistry = DocumentRegistryInterface(_documentRegistry);
    }

    function setName(string memory _name) public onlyOwner {
        name = _name;
    }

    function setUser(address _user) public onlyOwner {
        user = _user;
    }

    function register(address _document) public onlyRegisteredUser {
        FeeCalcInterface feeCalc = FeeCalcInterface(documentRegistry.feeCalc());

        documentRegistry.register(_document);

        // Transfer fee to company wallet
        address companyWallet = documentRegistry.companyWallet();
        assert(companyWallet != address(0));
        uint256 companyFee = feeCalc.getCompanyFee();
        assert(ERC20Interface(documentRegistry.token()).transfer(companyWallet, companyFee));

        // Transfer fee to network wallet
        address networkGrowthPoolWallet = documentRegistry.networkGrowthPoolWallet();
        assert(networkGrowthPoolWallet != address(0));
        uint256 networkGrowthFee = feeCalc.getNetworkGrowthFee();
        assert(ERC20Interface(documentRegistry.token()).transfer(networkGrowthPoolWallet, networkGrowthFee));
    }

}

