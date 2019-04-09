const BaseDocument = artifacts.require("BaseDocument");
const GrantDeedDocument = artifacts.require("GrantDeedDocument");
const FeeCalc = artifacts.require("DocumentFeeCalc");

const Fees = {
    Mainnet: (6 * Math.pow(10, 8)),
    Stage_Mainnet: (100),
    Rinkeby: (100),
    Test: 10
};

module.exports = (deployer, network) => {
    let fee;
    switch(network) {
        case "mainnet":
            fee = Fees.Stage_Mainnet;
            break;
        case "rinkeby":
            fee = Fees.Rinkeby;
            break;
        default:
            fee = Fees.Test;
    }
    deployer.deploy(BaseDocument, "")
        .then(() => deployer.deploy(GrantDeedDocument, "", ""))
        .then(() => deployer.deploy(FeeCalc, fee))
        .then(() => {
            console.log(BaseDocument.address+ ": BaseDocument");
            console.log(GrantDeedDocument.address+ ": GrantDeedDocument");
            console.log(FeeCalc.address+ ": FeeCalc");
        });
};