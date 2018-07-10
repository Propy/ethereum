"use strict";
const utils = require('ethereumjs-util');

const Deed = artifacts.require('DeedSimple');
const Property = artifacts.require('NewProperty');
const EscrowDeposit = artifacts.require('EscrowDeposit');
const ProxyFactory = artifacts.require('ProxyFactory');
const PropertyController = artifacts.require('PropertyController');
const UserRegistry = artifacts.require('UsersRegistry');
const Token = artifacts.require('TokenMock');

const DeedFlags = {
  Seller: 1,
  Buyer: 2,
  Ownership: 4,
  SingleRole: 64,
  StepDone: 128
}

const Users = {
  Seller: {
      Public: "0xC4397CC94db998b86AaB45Bb884a9aca8bbEb9e1",
      Private: "0x93bd9efea44d891bed9a3345d6b22e5d95d8605dca0dd4d4950b74e455ee0667",
      Flag: DeedFlags.Seller
  },
  Buyer: {
      Public: "0x896B6caEb4a19E838713951893aF60bF49Dc98c3",
      Private: "0xd0c09bcf575191bb0f711857ea280696d087fd3217ff2ae7ba29c638477ab16c",
      Flag: DeedFlags.Buyer
  },
  Notary: {
      Public: "0xb2eF9F2D89FCAD694B2f6dB51695884DD2063fF6",
      Private: "0x948cef701ae9fc183478af0388e64a70bae6904e214f7c0b7e38d35c1176b37f",
      Flag: (DeedFlags.Seller | DeedFlags.Ownership)
  }
}

const AdditionalBuyer = {
  Public: "0x795850c0a15462D3467326665AFf7023c4288A7E",
  Private: "0xf56a1fd8c2b9f22ad523f9b93e92dbbfb629c0a277f4bbd1aa58c545adfd3499",
  Flag: DeedFlags.Buyer
};

const AdditionalNotary = {
    Public: "0x795850c0a15462D3467326665AFf7023c4281A2E",
    Flag: DeedFlags.Ownership
}

const DeedStatus = {
  None: 0,
  Prepared: 1,
  Reserved: 2,
  Started: 3,
  FeePaid: 4,
  Finished: 5,
  Rejected: 6
}

const UserRoles = {
  Escrow: 2,
  Broker: 4,
  Notary: 8,
  Agent: 16,
  User: 128
}

const Flows = {
  Ukraine: [
      {Title: "Purchase Aggreement", counts: 1, Roles: (UserRoles.User), Flag: (DeedFlags.Seller)},
      {Title: "Prepared contract", counts: 1, Roles: (UserRoles.User), Flag: (DeedFlags.Seller | DeedFlags.Buyer)},
      {Title: "Tax", counts: 1, Roles: (UserRoles.User | UserRoles.Notary), Flag: (DeedFlags.Seller)},
      {Title: "Main contract", counts: pack_numbers(2, 1), Roles: (UserRoles.User), Flag: (DeedFlags.Seller | DeedFlags.Buyer)}
  ],

  AdditionalStep: {Title: "Additional", counts: 2, Roles: (UserRoles.Notary), Flag: (0)},
  AdditionalFinal: {Title: "Additional", counts: 2, Roles: (UserRoles.Notary), Flag: (0)}
}

function encode_contructor(owner, controller) {
  let f = '0x7bd0f002';
  let zeros = '000000000000000000000000';
  let call = f + zeros + owner.substr(2) + zeros + controller.substr(2);
  return call;
}

// a moves to high bits
// 0000 0000  0000 0000
//     a          b
function pack_numbers(a, b) {
  return (a << 8) | b;
}

contract('ConfigurableDeed (Ukraine flow)', (accounts) => {
  let deed;
  let property;
  let escrow;
  before('setup', async () => {
      await UserRegistry.deployed().then((instance) => {
          instance.create(Users.Seller.Public, "Mark", "Zukerberg", "GoodGuy", UserRoles.User, Users.Seller.Public);
          instance.create(Users.Buyer.Public, "John", "Dou", "BadGuy", UserRoles.User, Users.Buyer.Public);
          instance.create(Users.Notary.Public, "Willow", "Egbert", "UglyGuy", UserRoles.Notary, Users.Notary.Public);
          instance.create(AdditionalBuyer.Public, "Gabe", "Newell", "GameGuy", UserRoles.User, AdditionalBuyer.Public);
          instance.create(AdditionalNotary.Public, "Howard", "Lovecraft", "FearGuy", UserRoles.Notary, AdditionalNotary.Public);
      });
      await ProxyFactory.deployed().then((instance) => {
          return instance.createProxy(Deed.address, encode_contructor(accounts[0], PropertyController.address));
      })
      .then(result => {
          deed = Deed.at(result.logs[0].args.proxyAddress)
          console.log("Deed address:" + deed.address);
      });
      await Property.new(0, [accounts[0], accounts[1], accounts[2]], "test", "test st.", "http://localhost", 0, 222)
      .then(instance => property = instance)
      .then(() => property.setPropertyToPendingState(deed.address));
      await EscrowDeposit.new(deed.address).then(instance => escrow = instance);
      await Token.deployed().then((instance) => instance.mint(deed.address, 100));
  });

  it("should check contract owner", async () => {
    let owner = await deed.contractOwner();
    assert(accounts[0] == owner);
  });

  it("should check controller address", async () => {
    let controller = await deed.controller();
    assert(PropertyController.address, controller);
  });

  it("should init deed flow", async () => {
    await deed.init(
        Flows.Ukraine.map(v => utils.sha3(v.Title).slice(0, 4)).map(v => utils.bufferToHex(v)),
        Flows.Ukraine.map(v => v.counts)
    )
    .then(async () => {
        let status = await deed.status();
        assert(status == DeedStatus.Prepared);
    });
  });

  it("should reserve deed", async () => {
    await deed.reserve(
        property.address,
        1234,
        escrow.address
    )
    .then(async () => {
        let status = await deed.status();
        assert(status == DeedStatus.Reserved);
    });
  });

  it("should check property pending state", async () => {
    let property_address = await deed.property();
    let status = await Property.at(property_address).status();
    assert(status == 1);
  });

  it("should init users", async () => {
    await deed.initUsers(
        Object.keys(Users).map(u => Users[u].Public),
        '0x' + Object.keys(Users).map(v => Users[v].Flag.toString(16)).map(n => n.length == 1 ? '0' + n : n).join('')
    )
    .then(async () => {
        let status = await deed.status();
        assert(status == DeedStatus.Started);
    });
  });

  it("should set new users", async() => {
    await deed.setUsers(
        [AdditionalBuyer.Public, AdditionalNotary.Public],
        '0x' + Object.values([AdditionalBuyer, AdditionalNotary]).map(v => v.Flag.toString(16)).map(n => n.length == 1 ? '0' + n : n).join('')
    )
    .then(async () => {
        let flag = await deed.users(AdditionalBuyer.Public);
        assert(flag == AdditionalBuyer.Flag);
        let flagn = await deed.users(AdditionalNotary.Public);
        assert(flagn == AdditionalNotary.Flag);
        let b1 = await deed.buyers(0);
        let b2 = await deed.buyers(1);
    });
  });

  it("should set estate parts of buyers", async () => {
    await deed.setBuyersParts(
        [Users.Buyer.Public, AdditionalBuyer.Public],
        [pack_numbers(2, 3), pack_numbers(1, 3)]
    )
    .then(async () => {
        let part1 = await deed.parts(Users.Buyer.Public);
        let part2 = await deed.parts(AdditionalBuyer.Public);
        assert(part1 == pack_numbers(2, 3));
        assert(part2 == pack_numbers(1, 3));
    });
  });

  it("should load documents", async () => {
    let doc1 = utils.bufferToHex(utils.sha3("This is the document 1").slice(0, 32));
    let doc2 = utils.bufferToHex(utils.sha3("This is the document 2").slice(0, 32));
    let doc3 = utils.bufferToHex(utils.sha3("This is the document 3").slice(0, 32));
    // let doc4 = utils.bufferToHex(utils.sha3("This is the document 4").slice(0, 32));

    await deed.action(doc1)
    .then(async () => {
        let isLoaded = await deed.isLoadedDocument(doc1);
        assert(isLoaded);
        await deed.action(doc2);
    })
    .then(async () => {
        let isLoaded = await deed.isLoadedDocument(doc2);
        assert(isLoaded);
        await deed.action(doc3);
    })
    .then(async () => {
        let isLoaded = await deed.isLoadedDocument(doc3);
        assert(isLoaded);
        // await deed.action(doc4, [ signs4[0].v, signs4[1].v ], [ signs4[0].r, signs4[1].r ], [ signs4[0].s, signs4[1].s ]);
    });
    // .then(async () => {
    //     let isSigned = await deed.isSignedBy(doc4, Users.Seller.Public);
    //     let isSigned2 = await deed.isSignedBy(doc4, Users.Buyer.Public);
    //     assert(isSigned && isSigned2);
    // });
  });

  it("should add additional step before last", async () => {
    let additional_1 = utils.bufferToHex(utils.sha3("This is the additional document 1").slice(0, 32));
    let additional_2 = utils.bufferToHex(utils.sha3("This is the additional document 2").slice(0, 32));
    let doc4 = utils.bufferToHex(utils.sha3("This is the document 4").slice(0, 32));
    await deed.insertStep(
        utils.bufferToHex(utils.sha3(Flows.AdditionalStep.Title).slice(0, 4)),
        Flows.AdditionalStep.counts,
        4
    )
    .then(async () => {
        await deed.action(additional_1);
    })
    .then(async () => {
        let isLoaded = await deed.isLoadedDocument(additional_1);
        assert(isLoaded);
    })
    .then(async () => {
        await deed.action(additional_2);
    })
    .then(async () => {
        let isLoaded = await deed.isLoadedDocument(additional_2);
        assert(isLoaded);
        await deed.action(doc4);
    })
    .then(async () => {
        let isLoaded = await deed.isLoadedDocument(doc4);
        assert(isLoaded);
    });
  });

  it("should add additional step after all", async () => {
    let additional_1 = utils.bufferToHex(utils.sha3("This is the additional_final document 1").slice(0, 32));
    let additional_2 = utils.bufferToHex(utils.sha3("This is the additional_final document 2").slice(0, 32));
    await deed.insertStep(
        utils.bufferToHex(utils.sha3(Flows.AdditionalFinal.Title).slice(0, 4)),
        Flows.AdditionalFinal.counts,
        0
    )
    .then(async () => {
        await deed.action(additional_1);
    })
    .then(async () => {
        let isLoaded = await deed.isLoadedDocument(additional_1);
        assert(isLoaded);
    })
    .then(async () => {
        await deed.action(additional_2);
    })
    .then(async () => {
        let isLoaded = await deed.isLoadedDocument(additional_2);
        assert(isLoaded);
    });
  });

  it("should pay fee", async () => {
    await escrow.deposit(600);
    await escrow.deposit(634);
    await deed.payFee()
    .then(async () => {
        let status = await deed.status();
        assert(status == DeedStatus.FeePaid);
    });
  });

  it("should approve transfer ownership", async () => {
    let ownership = utils.bufferToHex(utils.sha3("This is the ownership document").slice(0, 32));
    await deed.ownershipTransfer(ownership)
    .then(async () => {
        let status = await deed.status();
        assert(status == DeedStatus.Finished);
    });
  });

  it("should check property owned state", async () => {
    let property_address = await deed.property();
    let status = await Property.at(property_address).status();
    assert(status == 0);
  });

});
