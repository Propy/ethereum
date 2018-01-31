"use strict";

module.exports = {
    increaseTime: (time) => {
        return new Promise((resolve, reject) => {
            web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [time],
                id: new Date().getTime()
            }, (error, result) => error ? reject(error) : resolve(result.result))
        });
    },

    mine: () => {
        return new Promise((resolve, reject) => {
            web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "evm_mine",
                id: new Date().getTime()
            }, (error, result) => error ? reject(error) : resolve(result.result))
        });
    },
};
