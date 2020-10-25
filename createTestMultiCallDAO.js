const fs = require('fs');
const path = require('path');
const Web3 = require('web3')
const { options } = require('./deployEthereum')
const { migrateDAO } = require('@daostack/migration')
const opts = {}



async function createTestDAO(options) {

  const arcVersion = '0.0.1-rc.47'
  // get the params suitable for v47
  options.arcVersion = arcVersion
  options.params = require('./testdao-multicall-params-v47.json')
  const result = await migrateDAO(options)

  const daoInfo = result.dao[options.arcVersion]

  return result
}

async function submitGSMultiCallProposal ({
  avatarAddress,
  callData,
  descHash,
  genericSchemeAddress,
  opts ,
  web3
}) {
  let tx

  const genericScheme = new web3.eth.Contract(
    require('@daostack/arc/build/contracts/GenericScheme.json').abi,
    genericSchemeAddress,
    opts
  )

  const prop = genericScheme.methods.proposeCall(
    avatarAddress,
    callData,
    0,
    descHash
  )

  const proposalId = await prop.call()
  tx = await prop.send()
  // await this.logTx(tx, 'Submit new Proposal.')

  return proposalId
}

/**
 * if called directly, run this function
 */
async function main() {
  console.log(`starting migration with options`)
  console.log(options)
  let migration = createTestDAO(options);
}
if (require.main === module) {
  main().then(console.log(`done`)).catch(err => {console.error(err);process.exit(1)})
} else {
  module.exports = createTestDAO

} 
