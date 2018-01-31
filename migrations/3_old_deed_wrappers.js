const DeedWrapper = artifacts.require("./DeedWrapper.sol");
const PropertyWrapper = artifacts.require("./PropertyWrapper.sol");
const Deed = artifacts.require("./Deed.sol");
const PropertyController = artifacts.require("./PropertyController.sol");
const UsersRegistry = artifacts.require("./UsersRegistry.sol");

const Users = {
    Seller: {
        firstname: "Mark",
        lastname: "Ginzburg",
        role: 128, // Person old 1
        wallet: "0x5ab5494be97bf06f50862a5fc5315a9efbfdb9a1", //0xadef322dc3dcf5bf611c9a776e103aaf3bc4cadb
        address: "0x5ab5494be97bf06f50862a5fc5315a9efbfdb9a1"
    },
    Buyer: {
        firstname: "Michael",
        lastname: "Arrington",
        role: 128, // Person old 1
        wallet: "0xc213ddab16623d9f005941c4ad717c41d43e58be", //0x52dbf10ef3743c267bcfb288c0985ae46c44ce62
        address: "0xc213ddab16623d9f005941c4ad717c41d43e58be"
    },
    Broker: {
        firstname: "Natalia",
        lastname: "Karayaneva",
        role: 4, // Broker old 2
        wallet: "0xeccf226bee1d09077235c82be95f825c0248e3d0",
        address: "0xeccf226bee1d09077235c82be95f825c0248e3d0"
    },
    Agent: {
        firstname: "Zoltan",
        lastname: "Rusaniuk",
        role: 8, // EscrowAgent(Notary) old 3
        wallet: "0xcadd8f35042ae922f00017b081bb03c297b3cf77",
        address: "0xcadd8f35042ae922f00017b081bb03c297b3cf77"
    }
}

module.exports = (deployer, network) => {
    if(network == "development") {
        deployer.deploy(Deed).then(() => Deed.deployed())
                            .then(() => deployer.deploy(DeedWrapper, Deed.address));
    } else if(network == "live" || network == "ropsten") {
        let propertyController;
        let usersRegistry;
        deployer.deploy(DeedWrapper)
            .then(() => PropertyController.deployed())
            .then(controller => propertyController = controller)
            .then(() => propertyController.registerDeed(DeedWrapper.address))
            .then(() => true)
            .then(() => deployer.deploy(
                PropertyWrapper,
                "0x25ff3fea1b61a798c7b5b4c1ad9ef82a1e8025ea",
                "Appt. 91",
                "5ef5a7f64301023d47d1672fed11c3749ccf6620"
            ))
            .then(() => propertyController.registerProperty(PropertyWrapper.address))
            .then(() => UsersRegistry.deployed())
            .then(instance => usersRegistry = instance)
            .then(() => usersRegistry.create(
                Users.Seller.address,
                Users.Seller.firstname,
                Users.Seller.lastname,
                "",
                Users.Seller.role,
                Users.Seller.wallet
            ))
            .then(() => usersRegistry.create(
                Users.Buyer.address,
                Users.Buyer.firstname,
                Users.Buyer.lastname,
                "",
                Users.Buyer.role,
                Users.Buyer.wallet
            ))
            .then(() => usersRegistry.create(
                Users.Broker.address,
                Users.Broker.firstname,
                Users.Broker.lastname,
                "",
                Users.Broker.role,
                Users.Broker.wallet
            ))
            .then(() => usersRegistry.create(
                Users.Agent.address,
                Users.Agent.firstname,
                Users.Agent.lastname,
                "",
                Users.Agent.role,
                Users.Agent.wallet
            ));
    }
}