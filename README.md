##Propy contracts environment - The Ethereum blockchain part of the Propy project, provides secure and powerful tools for execution of real estate deals

### Requirements
- nodejs  
`Ubuntu: sudo apt install nodejs`  
`Mac OS: brew install nodejs`

### Configuration
Into file `./network_keys/api/infura` put your [Infura](https://infura.io) api key  
Into file `./network_keys/private/wallets` put your wallet private keys

### Building
To install all dependencies use this command:
- `npm install`  

To compile all contracts use this one:
- `npm run compile`

### Console
You can run console to interact with all compiled smart contracts  
Use this command: `npm start <network>`  
Allowed networks:
- `rinkeby` Rinkeby(Clique) testnet
- `ropsten` Ropsten(PoW) testnet
- `kovan` Kovan(PoA) testnet
- `mainnet` Ethereum Main network

### Testing
- `npm run test`

### Deploying contracts to network
- `npm run migrate-test` to deploy to test network

### Propy Ecosystem
#### Addresses of the Propy ecosystem contracts at Rinkeby test network  
  
`0xb3ee9f63f2f21d959cde0cc46d82c2115da5da03` : DeedRegistry  
`0x0f973491a0dd905497005971565c9f57542384f9` : PROTokenContract  
`0x21115fa3281fefcc604471dfe94abc70a99577f7` : FeeCalc  
`0x08dd56f0be3d2b706f080a6f5d307e0cb48a1b36` : PropertyController  
`0x6e98b9e345993424a2121241471518b6c4af64f4` : PropertyFactory  
`0xd1a00fb6399c4cd4fe9a22bce2f1b66792c23c6c` : PropertyRegistry  
`0x41f7bb8450099c2be0dfcff2724ad25eca48c3e8` : PropertyProxy  
`0xe027ffb02b99078cfc6683e4c38de16899945089` : Storage  
`0xf36d9a9488a1aa2c5756bca8c0a7d53576d4efd0` : StorageInterface  
`0xa5507c406372fdb9d47747e507387e7e026be8e3` : StorageManager  
`0x423e9135b3f5928bf1772928c228abc8ed63a8fa` : UsersRegistry  
`0x7671e1ca3fbda8a9caf7b2384aaefbc51ea6a7e9` : MultiEventsHistory

---

#### Addresses of the Propy ecosystem contracts at Mainnet network

`0xe7e4c1a710bb5c2c749cf58ad628d0e5400eb55a`: DeedRegistry  
`0xe45893cb02d329b24ce5c09f7f6656cfb90150f2`: FeeCalc  
`0xd39256a12f208f97355ed9a83a031831f47e0307`: PropertyController  
`0x77faaad9334dd17ebc4177e852c90516baced9a8`: PropertyFactory  
`0x47b211b00610c23b65cc77a4d99d1db889ccfe37`: PropertyRegistry  
`0xb4052622b6e72999439e6edd01a52256ae241593`: PropertyProxy  
`0xe447bc92203eaf559b13b6ddbfdb54376ee256ee`: Storage  
`0x189e06a24af89c855f94dee10a73e0a6875846b7`: StorageInterface  
`0xdf9100ad45e30f5da06108348049bcf49f97472b`: StorageManager  
`0x57151c4892e0aac9756bad8751ffd7be2b41b5a9`: UsersRegistry  
`0xe6755ef70eb054aae618f561221df03b51d3fe28`: MultiEventsHistory  
`0xCe24A670c8Ca0827A638ac9F46c6212BB8c2E7C4`: RolesLibrary  
`0x85570b347ebbaba3d5486ae04036534272eb9940`: MultiSigWallet  
`0x264dc9baf4a89a473a3f7bdacd4d2d8db79ad065`: MetaDeedCalifornia  
`0xd4bc1c1e570dbc529fdd6c1285cd6df2c0620e5d`: MetaDeedUkraine  
`0x4d5af01e4a8003d14806f1fa5690b7759b657cb9`: BaseDeedFactory  
`0x960fb35f82ca7ef1c1edc64d897b17fa4f1adb23`: EscrowFactory  
`0x49307664272a840d37acd26a2521688a7808a693`: TokenController  
`0x9ec35047841efd5b77a90b8e895cec19d2473b2e`: DoubleSigner  
`0xf8764e2136deb200039f9fed68f3c6c41b61caea`: ProxyClonable  
`0xf98ee39029c0f57b7d1d85be0b5579f813a58308`: ForwarderClonable  
`0x85b4e5d92311e087edb59f49212f8ea37e7b13e7`: PoolClonable  
`0x9d207257f410303a779837fa0b55e7cafb15fec6`: ProxyFactory  