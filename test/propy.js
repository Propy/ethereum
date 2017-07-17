var Propy = artifacts.require("./Propy.sol");

contract('Propy', function(accounts) {
  it("should put 10000 MetaCoin in the first account", function() {
    return Propy.deployed().then(function(instance) {
      return instance.usersAddress.call();
    }).then(function(usersAddress) {
      console.log('usersAddress: ', usersAddress);
      // assert.equal(balance.valueOf(), 10000, "10000 wasn't in the first account");
    });
  });
});
