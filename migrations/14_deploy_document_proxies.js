const Proxy = artifacts.require("UpdatableProxy");
const DocumentRegistry = artifacts.require("DocumentRegistry");
const DocumentRegistrar = artifacts.require("DocumentRegistrar");
const StorageManagerInterface = artifacts.require("StorageManager");
const MultiSigWalletInterface = artifacts.require("MultiSigWallet");

const Storage = artifacts.require("Storage");
const RolesLibrary = artifacts.require("RolesLibrary");
const ProxyFactory = artifacts.require("ProxyFactory");
const StorageManager = artifacts.require("StorageManager");

const FeeCalc = artifacts.require("FeeCalc");

const Contracts = {
    Mainnet: {
        Storage: "0xe447bc92203eaf559b13b6ddbfdb54376ee256ee",
        Crate: "DocumentRegistry",
        CompanyWallet: "0x6d2f98Bad8ED6091ed5c16aAfd1ccC600Dd841ff",
        NetworkWallet: "0x4D64C4dfaa4a90816B92aeE1c011f7a941B0e61F",
        Token: "0x226bb599a12c826476e3a771454697ea52e9e220",
        RolesLibrary: "0xCe24A670c8Ca0827A638ac9F46c6212BB8c2E7C4",
        ProxyFactory: "0x9d207257f410303a779837fa0b55e7cafb15fec6",
        StorageManager: "0xdf9100ad45e30f5da06108348049bcf49f97472b",
        MultiSigWallet: "0x85570b347ebbaba3d5486ae04036534272eb9940",
        FeeCalc: "0xb377de6368f3f5b5fbc5f6d1f84a8bb7103c5392"
    },
    Rinkeby: {
        Storage: "0x5ab6fdb6803619df59dd9c1aef6aae29562e4b1a",
        Crate: "DocumentRegistry",
        CompanyWallet: "0x65ddD5D4D698Bf801bf5613de51F963394Fb2749",
        NetworkWallet: "0x65ddD5D4D698Bf801bf5613de51F963394Fb2749",
        Token: "0xfdd09d5d1ee53a91416675a82062528fb7d9b657",
        RolesLibrary: "0xf58148001929a999a7b789f516b743ac7c7f7ea8",
        ProxyFactory: "0x228112c4e3db9fb048c53027c6ce305acbc936aa",
        StorageManager: "0x3672ba830db80e6ddebe78db53447d21cf4c49f4",
        MultiSigWallet: "0x7453b6206770bd525b9b0ba49d88273dcf2706f2"
    },
    Test: {
        Storage: Storage.address,
        Crate: "DocumentRegistry",
        CompanyWallet: "0xb0904e024678e8495186e778c487af9a00d754f2",
        NetworkWallet: "0xb0904e024678e8495186e778c487af9a00d754f2",
        Token: "0x60a954bb1e592785c75823ff961ff917d898044a",
        RolesLibrary: RolesLibrary.address,
        ProxyFactory: ProxyFactory.address,
        StorageManager: StorageManager.address,
        MultiSigWallet: MultiSigWalletInterface.address
    }
}

module.exports = (deployer, network) => {
    let contracts;
    switch(network) {
        case "mainnet":
            contracts = Contracts.Mainnet;
            break;
        case "rinkeby":
            contracts = Contracts.Rinkeby;
            break;
        default:
            contracts = Contracts.Test;
    }
    let registry;
    let registrar;
    let manager;
    deployer.deploy(Proxy, DocumentRegistry.address)
        .then(reg => DocumentRegistry.at(reg.address))
        .then(reg => registry = reg)
        .then(() => StorageManagerInterface.at(contracts.StorageManager))
        .then(man => manager = man)
        .then(() => MultiSigWalletInterface.at(contracts.MultiSigWallet))
        .then(sig => network !== "rinkeby" ? sig.submitTransaction(
            manager.address,
            0,
            web3.eth.contract(StorageManagerInterface.abi).at(0).giveAccess.getData(registry.address, contracts.Crate)
        ) :
            manager.giveAccess(registry.address, contracts.Crate)
        )
        .then(() => registry.proxy_init(
            contracts.Storage,
            contracts.Crate,
            contracts.CompanyWallet,
            contracts.NetworkWallet,
            FeeCalc.address,
            contracts.Token,
            contracts.RolesLibrary))
        .then(() => deployer.deploy(Proxy, DocumentRegistrar.address))
        .then(reg => DocumentRegistrar.at(reg.address))
        .then(reg => registrar = reg)
        .then(() => registrar.proxy_init(registry.address, contracts.ProxyFactory))
        .then(() => {
            console.log("DocumentRegistry(Proxy): " + registry.address);
            console.log("DocumentRegistrar(Proxy): " + registrar.address);
        })
}