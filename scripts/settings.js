const path = require('path')
const { Arc } = require('@daostack/arc.js')
const ethers = require('ethers')
// this value should coincide with the "migration-experimental" versoin
const ARC_VERSION = '0.1.1-rc.13'


// private key of this address: 
/*
ganache_1     | Available Accounts
ganache_1     | ==================
ganache_1     | (0) 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 (100 ETH)
ganache_1     | (1) 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0 (100 ETH)
ganache_1     | (2) 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b (100 ETH)
ganache_1     | (3) 0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d (100 ETH)
ganache_1     | (4) 0xd03ea8624C8C5987235048901fB614fDcA89b117 (100 ETH)
ganache_1     | (5) 0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC (100 ETH)
ganache_1     | (6) 0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9 (100 ETH)
ganache_1     | (7) 0x28a8746e75304c0780E011BEd21C72cD78cd535E (100 ETH)
ganache_1     | (8) 0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E (100 ETH)
ganache_1     | (9) 0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e (100 ETH)
ganache_1     | 
ganache_1     | Private Keys
ganache_1     | ==================
ganache_1     | (0) 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
ganache_1     | (1) 0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1
ganache_1     | (2) 0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c
ganache_1     | (3) 0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913
ganache_1     | (4) 0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743
ganache_1     | (5) 0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd
ganache_1     | (6) 0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52
ganache_1     | (7) 0xa453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3
ganache_1     | (8) 0x829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4
ganache_1     | (9) 0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773
*/
const ADDRESS_1 = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
const PRIVATE_KEY_1 = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'

const ADDRESS_2 = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
const PRIVATE_KEY_2 = '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1'

async function getArc() {

    // const web3Provider = new ethers.providers.JsonRpcProvider( `https://rinkeby.infura.io/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2`)
    // const infuraProvider = new ethers.providers.InfuraProvider('rinkeby', 'e0cdf3bfda9b468fa908aa6ab03d5ba2')
    const web3Provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
    const wallet = new ethers.Wallet(PRIVATE_KEY_2, web3Provider)
    // wallet = web3Provider
    const arc = new Arc({
        // graphqlHttpProvider: "https://api.thegraph.com/subgraphs/name/daostack/v7_4_exp_rinkeby",
        // graphqlWsProvider: "wss://api.thegraph.com/subgraphs/name/daostack/v7_4_exp_rinkeby",
        web3Provider: wallet
    })
    const config = require('./config')
    this.package = require(config.prevmigration).private.package[ARC_VERSION]
    console.log(this.package)
 
    const contractInfos = Object.keys(this.package).map((x) => {
        return {
        id: x,
        address: this.package[x],
        version: ARC_VERSION
        }
    })
    await arc.setContractInfos(contractInfos)
    arc.package = this.package

    return arc
}
const OVERRIDES =  { 
    // gasLimit: 10000000,
    // gasPrice: 1000000000,
 }

module.exports = { 
    ARC_VERSION,
    ADDRESS_1,
    PRIVATE_KEY_1,
    ADDRESS_2,
    PRIVATE_KEY_2,
    getArc, 
    OVERRIDES
}