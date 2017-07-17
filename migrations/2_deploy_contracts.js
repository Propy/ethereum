//var ConvertLib = artifacts.require("./ConvertLib.sol");
//var Owned = artifacts.require("./Owned.sol");
var Propy = artifacts.require("./Propy.sol");

module.exports = function(deployer) {
  // deployer.deploy(Owned);
  // deployer.link(Owned, Propy);
  deployer.deploy(Propy);
};
