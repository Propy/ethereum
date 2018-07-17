const DocumentRegistry = artifacts.require("DocumentRegistry");
const DocumentRegistrar = artifacts.require("DocumentRegistrar");
const FeeCalc = artifacts.require("FeeCalc");
const StorageManagerInterface = artifacts.require("StorageManagerInterface");

const Contracts = {
    Mainnet: {
        Storage: "0xe447bc92203eaf559b13b6ddbfdb54376ee256ee",
        Crate: "DocumentRegistry",
        CompanyWallet: "0x6d2f98Bad8ED6091ed5c16aAfd1ccC600Dd841ff",
        NetworkWallet: "0x4D64C4dfaa4a90816B92aeE1c011f7a941B0e61F",
        Token: "0x4D64C4dfaa4a90816B92aeE1c011f7a941B0e61F",
        RolesLibrary: "0xCe24A670c8Ca0827A638ac9F46c6212BB8c2E7C4",
        ProxyFactory: "0x9d207257f410303a779837fa0b55e7cafb15fec6",
        StorageManager: "0xdf9100ad45e30f5da06108348049bcf49f97472b"
    },
    Rinkeby: {
        Storage: "0x5ab6fdb6803619df59dd9c1aef6aae29562e4b1a",
        Crate: "DocumentRegistry",
        CompanyWallet: "0x65ddD5D4D698Bf801bf5613de51F963394Fb2749",
        NetworkWallet: "0x65ddD5D4D698Bf801bf5613de51F963394Fb2749",
        Token: "0xfdd09d5d1ee53a91416675a82062528fb7d9b657",
        RolesLibrary: "0xf58148001929a999a7b789f516b743ac7c7f7ea8",
        ProxyFactory: "0x228112c4e3db9fb048c53027c6ce305acbc936aa",
        StorageManager: "0x3672ba830db80e6ddebe78db53447d21cf4c49f4"
    },
    Test: {
        Storage: "0xb103aaf380bbda4621cf96ece41bd54f8511753d",
        Crate: "DocumentRegistry",
        CompanyWallet: "0xb0904e024678e8495186e778c487af9a00d754f2",
        NetworkWallet: "0xb0904e024678e8495186e778c487af9a00d754f2",
        Token: "0x60a954bb1e592785c75823ff961ff917d898044a",
        RolesLibrary: "0x24fa3beb0f92a1663336fea52b467d1538f847ea",
        ProxyFactory: "0x17e0139087554b07978f2f14c63ea91f0bd3b8c6",
        StorageManager: "0x8a05e6766136103e6899b6eaf028afb1d2f1af94"
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
    deployer.deploy(
        DocumentRegistry,
        contracts.Storage,
        contracts.Crate,
        contracts.CompanyWallet,
        contracts.NetworkWallet,
        FeeCalc.address,
        contracts.Token,
        contracts.RolesLibrary
    )
        .then(() => deployer.deploy(DocumentRegistrar, DocumentRegistry.address, contracts.ProxyFactory))
        .then(() => {
            console.log("DocumentRegistry: " + DocumentRegistry.address);
            console.log("DocumentRegistrar: " + DocumentRegistrar.address);
        });
}