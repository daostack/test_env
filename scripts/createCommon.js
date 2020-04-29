const { getArc, ADDRESS_1, PRIVATE_KEY_1, ARC_VERSION, OVERRIDES } = require('./settings')
const { getForgeOrgData, getSetSchemesData } = require('@daostack/common-factory')

async function createCommon() {
  const DAONAME = `Test DAO ${Math.floor(Math.random() * 100000)}`
  let tx;
  let receipt
  const arc = await getArc();
  // console.log(`fetching contractinfo from graphql...`)
  // const contractInfo = arc.getContractInfoByName(`DAOFactoryInstance`, ARC_VERSION)
  const contractInfo = {
    address: arc.package['DAOFactoryInstance']
  }
  console.log(1)
 
  // console.log(`fetching contractinfo from graphql...`)
  // const contractInfo = arc.getContractInfoByName(`DAOFactoryInstance`, ARC_VERSION)
  const contractABI = arc.getABI( undefined, 'DAOFactory', ARC_VERSION)
  const daoFactoryContract = await arc.getContract(contractInfo.address, contractABI)
  // const votingMachineInfo = arc.getContractInfoByName(`GenesisProtocol`, ARC_VERSION)
  const votingMachineInfo = {
    addres: arc.package['GenesisProtocol']
  }

  console.log(`Calling DAOFactory.forgeOrg(...)`)
  const forgeOrgData = 
      getForgeOrgData({
          DAOFactoryInstance: contractInfo.address,
          orgName: DAONAME,
          founderAddresses: [ADDRESS_1],
          repDist: [100]
      })
  tx = await daoFactoryContract.forgeOrg(...forgeOrgData, OVERRIDES)
  console.log(`waiting for tx to be mined`)
  console.log(`https://rinkeby.etherscan.io/tx/${tx.hash}`)
  receipt = await tx.wait()
  console.log(`done!`)
  // get the new avatar address of the thing that was just created..
  const newOrgEvent = receipt.events.filter((e) => e.event === 'NewOrg')[0]
  const newOrgAddress = newOrgEvent.args['_avatar']

  console.log(`Calling DAOFactory.setSchemes(...)`)
  // TODO: Use proper IPFS hash
  let ipfsHash = 'metaData'
  // deadline in Ethereum time, where 1 unit = 1 second (I think)
  const deadline = (await arc.web3.getBlock('latest')).timestamp + 3000
  // console.log(deadline)
  const schemeData = getSetSchemesData({
      DAOFactoryInstance: contractInfo.address,
      avatar: newOrgAddress,
      votingMachine: votingMachineInfo.address,
      fundingToken: '0x0000000000000000000000000000000000000000',
      minFeeToJoin: 100,
      memberReputation: 100,
      goal: 1000,
      deadline,
      metaData: ipfsHash,
    })

  tx = await daoFactoryContract.setSchemes(...schemeData, OVERRIDES)
  console.log(`waiting for tx to be mined`)
  console.log(`https://rinkeby.etherscan.io/tx/${tx.hash}`)
  receipt = await tx.wait()
  console.log(`Created a DAO at ${newOrgAddress} with name "${DAONAME}"`)

  process.exit(0)
};

if (require.main === module) {
  createCommon().then(console.log(`done`)).catch(err => {console.error(err);process.exit(1)})
} 
module.exports = { createCommon }
