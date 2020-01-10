pragma solidity 0.5.8;

import "./Storage.sol";
import "./StorageAdapter.sol";
import "./RolesLibraryAdapter.sol";
import "./BaseDocument.sol";

contract DocumentRegistry is StorageAdapter, RolesLibraryAdapter {

    address public companyWallet;
    address public networkGrowthPoolWallet;
    address public feeCalc;
    address public token;

    StorageInterface.Bytes32AddressMapping documents;
    StorageInterface.StringAddressSetMapping tags;
    StorageInterface.AddressBytes32Bytes32Mapping documentsv2;

    event DocumentRegistered(address _document, bytes32 _hash, bytes32 _type);
    event DocumentRegisteredv2(bytes32 _hash, bytes32 _metahash);
    event Error(string _message);

    modifier isDocumentFinalized(BaseDocument _document) {
        if(!_document.finalized()) {
            emit Error("Document is not finalized");
            return;
        }
        _;
    }

    constructor(
        Storage _store,
        bytes32 _crate,
        address _companyWallet,
        address _networkGrowthPoolWallet,
        address _feeCalc,
        address _token,
        address _rolesLibrary
    ) public StorageAdapter(_store, _crate) RolesLibraryAdapter(_rolesLibrary) {
        companyWallet = _companyWallet;
        networkGrowthPoolWallet = _networkGrowthPoolWallet;
        feeCalc = _feeCalc;
        token = _token;
        documents.init("RegisteredDocuments");
        tags.init("ContainsTagDocuments");
    }

    function proxy_init(
        Storage _store,
        bytes32 _crate,
        address _companyWallet,
        address _networkGrowthPoolWallet,
        address _feeCalc,
        address _token,
        address _rolesLibrary
    ) public {
        require(address(rolesLibrary) == address(0));
        store.init(_store, _crate);
        rolesLibrary = RolesLibraryInterface(_rolesLibrary);
        companyWallet = _companyWallet;
        networkGrowthPoolWallet = _networkGrowthPoolWallet;
        feeCalc = _feeCalc;
        token = _token;
        documents.init("RegisteredDocuments");
        tags.init("ContainsTagDocuments");
        documentsv2.init("RegisteredDocumentsv2");
    }

    function setWallets(address _companyWallet, address _networkGrowthPoolWallet) public auth {
        companyWallet = _companyWallet;
        networkGrowthPoolWallet = _networkGrowthPoolWallet;
    }

    function setFeeCalc(address _feeCalc) public auth {
        feeCalc = _feeCalc;
    }

    function register(BaseDocument _document) public auth isDocumentFinalized(_document) {
        require(!exists(_document.hash()), "Document is already exists!");
        store.set(documents, _document.hash(), address(_document));
        for(uint256 i = 0; i < _document.tagsLength(); ++i) {
            store.add(tags, _document.tags(i), address(_document));
        }
        emit DocumentRegistered(address(_document), _document.hash(), _document.documentType());
    }

    function getDocument(bytes32 _hash) public view returns(address) {
        return store.get(documents, _hash);
    }

    function getDocumentsByTag(string memory _tag) public view returns(address[] memory) {
        return store.get(tags, _tag);
    }

    function exists(bytes32 _hash) public view returns(bool) {
        return store.get(documents, _hash) != address(0);
    }
    
    // Access methods for version 2 (only hash)
    // Here we don't deploy contract for document but just store physical(electronic) document hash
    // and metadata hash which is just JSON with all the data related to registration.
    
    function registerv2(bytes32 _hash, bytes32 _metahash) public auth {
        require(!existsv2(_hash), "Document already exists!");
        store.set(documentsv2, address(0), _hash, _metahash);
        emit DocumentRegisteredv2(_hash, _metahash);
    }
    
     function existsv2(bytes32 _hash) public view returns(bool) {
        return store.get(documentsv2, address(0), _hash) != bytes32(0);
    }
    
    function getMetahash(bytes32 _hash) public view returns(bytes32) {
        return store.get(documentsv2, address(0), _hash);
    }

}
