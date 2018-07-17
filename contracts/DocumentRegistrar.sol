pragma solidity 0.4.24;

pragma experimental ABIEncoderV2;

import "./base/Owned.sol";

contract DocumentRegistryInterface {
    function companyWallet() public view returns(address);
    function networkGrowthPoolWallet() public view returns(address);
    function feeCalc() public view returns(address);
    function token() public view returns(address);
    function register(BaseDocument) public;
}

contract ProxyFactoryInterface {
    event ProxyDeployed(address proxyAddress, address targetAddress);
    function createProxy(address, bytes) public returns(address);
}

contract BaseDocument {
    function proxy_init(address, bytes32) public;
    function addTag(string) public;
    function setFinalized() public;
}

contract ERC20Interface {
    function transfer(address, uint256) public returns(bool);
    function transferFrom(address, address, uint256) returns(bool);
}

contract FeeCalc {
    function getCompanyFee() public view returns(uint256);
    function getNetworkGrowthFee() public view returns(uint256);
}

contract DocumentRegistrar is Owned {

    DocumentRegistryInterface public documentRegistry;
    ProxyFactoryInterface public proxyFactory;

    constructor(address _documentRegistry, address _proxyFactory) {
        documentRegistry = DocumentRegistryInterface(_documentRegistry);
        proxyFactory = ProxyFactoryInterface(_proxyFactory);
    }

    function proxy_init(address _documentRegistry, address _proxyFactory) public {
        require(contractOwner == address(0));
        contractOwner = msg.sender;
        documentRegistry = DocumentRegistryInterface(_documentRegistry);
        proxyFactory = ProxyFactoryInterface(_proxyFactory);
    }

    function registerWithCustomTemplate(BaseDocument _template, bytes32 _hash, string[] _tags) public onlyContractOwner {
        require(_tags.length < 32);
        BaseDocument document = BaseDocument(proxyFactory.createProxy(_template, ""));
        document.proxy_init(contractOwner, _hash);
        for(uint256 i = 0; i < _tags.length; ++i) {
            document.addTag(_tags[i]);
        }
        document.setFinalized();
        registerDocument(document);
    }

    function registerDocument(BaseDocument _document) public onlyContractOwner {
        documentRegistry.register(_document);
        payFeeI();
    }

    function payFeeI() internal returns(bool) {
        address companyWallet = documentRegistry.companyWallet();
        address networkWallet = documentRegistry.networkGrowthPoolWallet();
        require(companyWallet != address(0) && networkWallet != address(0));
        ERC20Interface token = ERC20Interface(documentRegistry.token());
        FeeCalc feeCalc = FeeCalc(documentRegistry.feeCalc());
        require(token.transfer(companyWallet, feeCalc.getCompanyFee()));
        require(token.transfer(networkWallet, feeCalc.getNetworkGrowthFee()));
    }

}
