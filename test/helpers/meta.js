"use strict";


module.exports = {
    roles: {
        "Escrow": 2,
        "Broker": 4,
        "Notary": 8,
        "Title company agent": 16,
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
                DeedRegistry: {address: "0xb3ee9f63f2f21d959cde0cc46d82c2115da5da03"},
                FakeCoin: {address: "0x0f973491a0dd905497005971565c9f57542384f9"},
                FeeCalc: {address: "0x21115fa3281fefcc604471dfe94abc70a99577f7"},
                PropertyController: {address: "0x08dd56f0be3d2b706f080a6f5d307e0cb48a1b36"},
                PropertyFactory: {address: "0x885395f2ca0082e1b0e3da6f4bab195ec4b826b6"},
                PropertyRegistry: {address: "0xd1a00fb6399c4cd4fe9a22bce2f1b66792c23c6c"},
                PropertyProxy: {address: "0x41f7bb8450099c2be0dfcff2724ad25eca48c3e8"},
                Storage: {address: "0xe027ffb02b99078cfc6683e4c38de16899945089"},
                StorageInterface: {address: "0xf36d9a9488a1aa2c5756bca8c0a7d53576d4efd0"},
                StorageManager: {address: "0xa5507c406372fdb9d47747e507387e7e026be8e3"},
                UsersRegistry: {address: "0x423e9135b3f5928bf1772928c228abc8ed63a8fa"},
                MultiEventsHistory: {address: "0x7671e1ca3fbda8a9caf7b2384aaefbc51ea6a7e9"},
            },
            parties: {
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
            }
        }
    }

}
