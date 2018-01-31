"use strict";


module.exports = {
    roles: {
        "Escrow": 2,
        "Broker": 4,
        "Notary": 8,
        "Title company agent": 16,
        "User": 128,
    },
    networks: {
        live: {
            contracts: {
                "token": {
                    address: "0x226bb599a12c826476e3a771454697ea52e9e220",
                    abi: [{"constant":true,"inputs":[],"name":"multiAsset","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"commitUpgrade","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getLatestVersion","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_reference","type":"string"},{"name":"_sender","type":"address"}],"name":"_forwardTransferFromWithReference","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"emitApprove","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"emitTransfer","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"recoverTokens","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"etoken2","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getPendingVersionTimestamp","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"purgeUpgrade","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"optIn","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_reference","type":"string"}],"name":"transferFromWithReference","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_icap","type":"bytes32"},{"name":"_value","type":"uint256"}],"name":"transferToICAP","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_icap","type":"bytes32"},{"name":"_value","type":"uint256"},{"name":"_reference","type":"string"}],"name":"transferToICAPWithReference","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_sender","type":"address"}],"name":"_forwardApprove","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_symbol","type":"string"},{"name":"_name","type":"string"}],"name":"change","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_icap","type":"bytes32"},{"name":"_value","type":"uint256"},{"name":"_reference","type":"string"},{"name":"_sender","type":"address"}],"name":"_forwardTransferFromToICAPWithReference","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_icap","type":"bytes32"},{"name":"_value","type":"uint256"},{"name":"_reference","type":"string"}],"name":"transferFromToICAPWithReference","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_icap","type":"bytes32"},{"name":"_value","type":"uint256"}],"name":"transferFromToICAP","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"etoken2Symbol","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getPendingVersion","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_reference","type":"string"}],"name":"transferWithReference","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_etoken2","type":"address"},{"name":"_symbol","type":"string"},{"name":"_name","type":"string"}],"name":"init","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_newVersion","type":"address"}],"name":"proposeUpgrade","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"optOut","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_from","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_sender","type":"address"}],"name":"getVersionFor","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newVersion","type":"address"}],"name":"UpgradeProposal","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}]
                },
            }
        },
        rinkeby: {
            contracts: {
                PropertyController: {address: "0x18f83862e5be5eb393486f02c8d5281441b906ef"},
                PropertyFactory: {address: "0x8633cd26dcff9be2ff4863f48cbe273eaca32124"},
                PropertyProxy: {address: "0x18cca68335ebb0e141dc86c6ced099e84b8d4183"},
                PropertyRegistry: {address: "0x39ce89943634dfcf99fa9a28d3ace7fa624d7d65"},
                DeedRegistry: {address: "0x667b4a5310378e9bc2bc26a2c6e4172454414b6c"},
                UsersRegistry: {address: "0x2495b156062c946f89707c28dc144291e6f59341"},
                TokenMock: {address: "0x81f5cfbc0472e928e47f6b8eb40f296ed7cf10a7"},
                FeeCalc: {address: "0xbf6d27ac2378022cc5ac9db57801db789bc2672d"},
                MultiEventsHistory: {address: "0x15df06086a75b38a837f14ea3d550b89ed266641"},
                Storage: {address: "0x11838e9e5ecd2f0a62b2a801fe18fa42c7dd93cb"},
                StorageInterface: {address: "0xd2ca6faee806841cf07645806b992305eda2c9da"},
                StorageManager: {address: "0x78f0be1d3ced872d6f300f831f59297215f8054f"},
                RolesLibrary: {address: "0xabe108964278b97b94753c093bc518ea3e97ac20"},
                MetaDeedCalifornia: {address: "0xca0bfcb480284aa89d10502639a56721557c28f1"},

                MetaDeedUkraine: {address: "0x0"},

                BaseDeed: {address: "0x0"},
                EscrowEther: {address: "0x0"},
                EscrowOracle: {address: "0x0"},
                Property: {address: "0x0"},
            },
            parties: {
                "Seller": {
                    firstname: "Josh",
                    lastname: "Healerson",
                    role: "User",
                    address: "0x65ddD5D4D698Bf801bf5613de51F963394Fb2749",
                },
                "Buyer": {
                    firstname: "Sir",
                    lastname: "Buy-a-Lot",
                    role: "User",
                    address: "0x252490Bbcf48C58c90F5489A2A5bA0B4cDC21947",
                },

                "Seller broker": {
                    firstname: "Mark",
                    lastname: "Doe",
                    role: "Broker",
                    address: "0x2f6bc8EBa88c57EA523cf43Cb86b5e7917F02f8B"
                },
                "Buyer broker": {
                    firstname: "James",
                    lastname: "Poppins",
                    role: "Broker",
                    address: "0xf720b4568A72DDAa1c1FcA43cB5d5dfa46edfdf3"
                },
                "Notary": {
                    firstname: "Suu",
                    lastname: "Bri",
                    role: "Notary",
                    address: "0x07197417872Cd86bA79F1b921Da49e8426Bfe6D3"
                },
                "Title company agent": {
                    firstname: "Mira",
                    lastname: "Peace",
                    role: "Title company agent",
                    address: "0xc3b927ac0FBf4d6c81b8EE8fF08A59c221a1035d"
                }
            },
            multiSigOwners: [
                "0x65ddD5D4D698Bf801bf5613de51F963394Fb2749",
                "0x8d15d0248a5ee8412710966Cc9c9b5A3211c7D7B",
                "0xa8BC250DbC1dC0aCEDB05799989948C438be5D72",
            ],
        }
    }

}
