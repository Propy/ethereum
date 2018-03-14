function getTransactionsByAccount(myaccount, startBlockNumber, endBlockNumber) {
    if (endBlockNumber == null) {
      endBlockNumber = eth.blockNumber;
      console.log("Using endBlockNumber: " + endBlockNumber);
    }
    if (startBlockNumber == null) {
      startBlockNumber = endBlockNumber - 1000;
      console.log("Using startBlockNumber: " + startBlockNumber);
    }
    console.log("Searching for transactions to/from account \"" + myaccount + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);
  
    let gas_sum = 0;
    for (var i = startBlockNumber; i <= endBlockNumber; i++) {
      if (i % 1000 == 0) {
        console.log("Searching block " + i);
      }
      var block = web3.eth.getBlock(i, true);
      if (block != null && block.transactions != null) {
        block.transactions.forEach( function(e) {
          if (myaccount == "*" || myaccount == e.from || myaccount == e.to) {
              let transaction = web3.eth.getTransactionReceipt(e.hash);
              gas_sum += transaction.gasUsed;
              console.log(e.hash + ": " + transaction.gasUsed);
          }
        })
      }
    }
    console.log("Gas used by migration: " + gas_sum);
  }
  module.exports = () => {
    getTransactionsByAccount("0xc0a6b26cb31b771e1415aa732e07cf92adc8ebca", 2460345, 2460461);
  }

