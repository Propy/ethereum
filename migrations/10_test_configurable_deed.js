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

module.exports = (deployer, network, users) => {
    if (network === 'test' || network === 'rinkeby') {
        deployer.deploy(ProxyFactory)
        .then(() => deployer.deploy(Deed, 0))
        //.then(() => deployer.deploy(Property, 0, [users[0], users[1], users[2]], "test", "test st.", "http://localhost", 0, 222))
        //.then(() => deployer.deploy(EscrowDeposit, Deed.address))
        .then(() => {
            console.log("Configurable Deed Environment:");
            for(let contract of Contracts) {
                console.log(`${contract.address}: ${contract._json.contractName}`);
            }
        })
    }
}