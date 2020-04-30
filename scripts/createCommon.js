const path = require('path')
const { getArc, ADDRESS_1, PRIVATE_KEY_1, ARC_VERSION, OVERRIDES } = require('./settings')
const { getForgeOrgData, getSetSchemesData } = require('@daostack/common-factory')

async function createCommon(opts = {
  name: "",
  fundingToken: '0x0000000000000000000000000000000000000000',
  minFeeToJoin: 100,
  memberReputation: 1000,
  fundingGoal: 1000
 }
) {
  const defaultOptions = {
    fundingToken: '0x0000000000000000000000000000000000000000',
    minFeeToJoin: 100,
    memberReputation: 1000,
    fundingGoal: 1000
  }
  opts = { ...defaultOptions, ...opts}
  if (!opts.name) {
    opts.name = `Test DAO ${Math.floor(Math.random() * 100000)}`
  }
  let tx;
  let receipt
  const arc = await getArc();
  const contractInfo = {
    address: arc.package['DAOFactoryInstance']
  }
  const abiDir = path.join(require.resolve('@daostack/migration-experimental'), '..')
  const contractABI = require(path.join(abiDir, 'contracts', ARC_VERSION,'DAOFactory.json')).abi
  const daoFactoryContract = await arc.getContract(contractInfo.address, contractABI)
  const votingMachineInfo = {
    address: arc.package['GenesisProtocol']
  }
  if (!votingMachineInfo.address) {
    throw Error(`No GenesisProtocol found in arc.package`)
  }

  console.log(`Calling DAOFactory.forgeOrg(...)`)
  const forgeOrgData = 
      getForgeOrgData({
          DAOFactoryInstance: contractInfo.address,
          orgName: opts.name,
          founderAddresses: [ADDRESS_1],
          repDist: [100]
      })
  tx = await daoFactoryContract.forgeOrg(...forgeOrgData, OVERRIDES)
  console.log(`waiting for tx to be mined`)
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
      fundingToken: opts.fundingToken,
      minFeeToJoin: opts.minFeeToJoin,
      memberReputation: opts.memberReputation,
      goal: opts.fundingGoal,
      deadline,
      metaData: ipfsHash,
    })

  tx = await daoFactoryContract.setSchemes(...schemeData, OVERRIDES)
  console.log(`waiting for tx to be mined`)
  receipt = await tx.wait()
  console.log(`Created a DAO at ${newOrgAddress} with name "${opts.name}"`)
};

async function main() {
  await createCommon({
    name: "Common test 1"
  })
  await createCommon({
    name: "Common test 2"
  })
}

if (require.main === module) {
  main().catch(err => {console.error(err);process.exit(1)})
} 
module.exports = { createCommons: main }
