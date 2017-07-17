module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      network_id: 4,
      host: "localhost",
      gas: 4000000,
      gasPrice: 2776297000,
      port: 8546,
      network_id: "*" // Match any network id
    }
  }
};
