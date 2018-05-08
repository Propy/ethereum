"use strict";

const Deed = artifacts.require('Deed');
const Property = artifacts.require('NewProperty');
const ProxyFactory = artifacts.require('ProxyFactory');
const Escrow = artifacts.require('Escrow');

// Escrows
const EscrowEther = artifacts.require('EscrowEther');
const EscrowDeposit = artifacts.require('EscrowDeposit');
const EscrowToken = artifacts.require('EscrowToken');

const Contracts = [
    ProxyFactory,
    Deed,
    //Property,
    //EscrowEther,
    //EscrowDeposit,
    //EscrowToken
];

const CONTROLLER = "0x3cab760b6da28f172df75a3ca1f3662fb0e694ac";

module.exports = (deployer, network, users) => {
    if (network === 'mainnet_parity_test') {
        deployer.deploy(ProxyFactory)
        .then(() => deployer.deploy(Deed, CONTROLLER))
        .then(() => {
            console.log("Configurable Deed Environment:");
            for(let contract of Contracts) {
                console.log(`${contract.address}: ${contract._json.contractName}`);
            }
        })
    }
}