const BaseDocument = artifacts.require("BaseDocument");
const FeeCalc = artifacts.require("FeeCalc");

const Fees = {
    Mainnet: (6 * Math.pow(10, 8)),
    Rinkeby: (100),
    Test: 10
}

module.exports = (deployer, network) => {
    let fee;
    switch(network) {
        case "mainnet":
            fee = Fees.Mainnet;
            break;
        case "rinkeby":
            fee = Fees.Rinkeby;
            break;
        default:
            fee = Fees.Test;
    }
    deployer.deploy(BaseDocument, "")
        .then(() => deployer.deploy(FeeCalc, fee))
        .then(() => {
            console.log("BaseDocument: " + BaseDocument.address);
            console.log("FeeCalc: " + FeeCalc.address);
        });
}