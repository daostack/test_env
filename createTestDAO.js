const fs = require('fs');
const path = require('path');
const Web3 = require('web3')
const { options } = require('./deployEthereum')
const { migrateDAO } = require('@daostack/migration')
const opts = {}



// async function assignGlobalVariables (web3, spinner, opts, logTx, previousMigration) {
//   this.arcVersion = require('@daostack/arc/package.json').version
//   this.web3 = web3
//   this.spinner = spinner
//   this.opts = opts
//   this.logTx = logTx
//   this.base = previousMigration.base[this.arcVersion]
// }

async function createTestDAO(options) {
  options.params = require('./testdao-params.json')
 console.log(require(options.prevmigration).private.test[options.arcVersion])
  const result = await migrateDAO(options)

  const daoInfo = result.dao[options.arcVersion]


  // const externalTokenAddress = '0x0d8775f648430679a709e98d2b0cb6250d2887ef'
  // const web3 = new Web3(options.provider)

  // web3.eth.accounts.wallet.clear()

  // let privateKeys = [
  //   '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
  //   '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
  //   '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c',
  //   '0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913',
  //   '0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743',
  //   '0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd',
  //   '0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52',
  //   '0xa453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3',
  //   '0x829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4',
  //   '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773'
  // ]
  // // const GENToken = await new this.web3.eth.Contract(
  // //   require('@daostack/arc/build/contracts/DAOToken.json').abi,
  // //   GEN,
  // //   this.opts
  // // )

  // for (let i = 0; i < privateKeys.length; i++) {
  //   web3.eth.accounts.wallet.add(web3.eth.accounts.privateKeyToAccount(privateKeys[i]))
  //   // await GENToken.methods.mint(web3.eth.accounts.wallet[i].address, web3.utils.toWei('1000')).send()
  // }

  // let accounts = web3.eth.accounts.wallet
  // const actionMock = require(options.prevmigration).private.test[options.arcVersion].ActionMock
  // const contributionRewardAddress = require(options.prevmigration).private.test[options.arcVersion].ContributionReward
  // daoInfo.ContributionReward = contributionRewardAddress
  // const genesisProtocolAddress = require(options.prevmigration).private.test[options.arcVersion].ContributionReward
  // daoInfo.GenesisProtocol = genesisProtocolAddress

  // console.log(daoInfo)
  // const {
  //   // gsProposalId,
  //   queuedProposalId,
  //   preBoostedProposalId,
  //   boostedProposalId,
  //   executedProposalId
  // } = await submitDemoProposals(
  //     accounts, 
  //     web3, 
  //     daoInfo,
  //     externalTokenAddress, 
  //     actionMock
  //   )

  // result.dao[options.arcVersion] = Object.assign(
  //   daoInfo, {
  //     // gsProposalId,
  //     queuedProposalId,
  //     preBoostedProposalId,
  //     boostedProposalId,
  //     executedProposalId,
  //   }
  // )


  return result
}

async function submitDemoProposals (accounts, web3, daoInfo, externalTokenAddress, actionMockAddress) {
  const [PASS, FAIL] = [1, 2]
  const actionMock = await new web3.eth.Contract(
    require('@daostack/arc/build/contracts/ActionMock.json').abi,
    actionMockAddress,
    this.opts
  )
  console.log(daoInfo)
  // let callData = await actionMock.methods.test2(daoInfo.Avatar).encodeABI()
  const avatarAddress = daoInfo.Avatar
  // const opts = {}
  // let gsProposalId = await submitGSProposal({
  //   avatarAddress: avatarAddress,
  //   callData,
  //   descHash: '0x000000000000000000000000000000000000000000000000000000000000abcd',
  //   genericSchemeAddress: daoInfo.GenericScheme,
  //   opts,
  //   web3
  // })

  // QUEUED PROPOSAL //
  let queuedProposalId = await submitProposal({
    avatarAddress: avatarAddress,
    descHash: '0x000000000000000000000000000000000000000000000000000000000000abcd',
    rep: web3.utils.toWei('10'),
    tokens: web3.utils.toWei('10'),
    eth: web3.utils.toWei('10'),
    external: web3.utils.toWei('10'),
    periodLength: 0,
    periods: 1,
    beneficiary: accounts[1].address,
    externalTokenAddress: externalTokenAddress,
    contributionRewardAddress: daoInfo.ContributionReward,
    web3,
    opts
  })

  await voteOnProposal({
    proposalId: queuedProposalId,
    outcome: FAIL,
    voter: accounts[2].address,
    daoInfo,
    web3
  })

  await voteOnProposal({
    proposalId: queuedProposalId,
    outcome: PASS,
    voter: accounts[1].address,
    daoInfo,
    web3
  })

  // PRE BOOSTED PROPOSAL //
  let preBoostedProposalId = await submitProposal({
    avatarAddress: avatarAddress,
    descHash: '0x000000000000000000000000000000000000000000000000000000000000efgh',
    rep: web3.utils.toWei('10'),
    tokens: web3.utils.toWei('10'),
    eth: web3.utils.toWei('10'),
    external: web3.utils.toWei('10'),
    periodLength: 0,
    periods: 1,
    beneficiary: accounts[1].address,
    externalTokenAddress: externalTokenAddress,
    web3,
    opts
  })

  await stakeOnProposal({
    proposalId: preBoostedProposalId,
    outcome: PASS,
    staker: accounts[1].address,
    amount: web3.utils.toWei('1000')
  })

  // BOOSTED PROPOSAL //
  let boostedProposalId = await submitProposal({
    avatarAddress: avatarAddress,
    descHash: '0x000000000000000000000000000000000000000000000000000000000000ijkl',
    rep: web3.utils.toWei('10'),
    tokens: web3.utils.toWei('10'),
    eth: web3.utils.toWei('10'),
    external: web3.utils.toWei('10'),
    periodLength: 0,
    periods: 1,
    beneficiary: accounts[1].address,
    externalTokenAddress: externalTokenAddress
  })

  await stakeOnProposal({
    proposalId: boostedProposalId,
    outcome: PASS,
    staker: accounts[2].address,
    amount: web3.utils.toWei('1000')
  })

  await voteOnProposal({
    proposalId: boostedProposalId,
    outcome: PASS,
    voter: accounts[1].address,
    daoInfo,
    web3
  })

  await increaseTime(259300, web3)

  await voteOnProposal({
    proposalId: boostedProposalId,
    outcome: PASS,
    voter: accounts[0].address,
    daoInfo,
    web3
  })

  // EXECUTED PROPOSAL //
  let executedProposalId = await submitProposal({
    avatarAddress: avatarAddress,
    descHash: '0x000000000000000000000000000000000000000000000000000000000000ijkl',
    rep: web3.utils.toWei('10'),
    tokens: web3.utils.toWei('10'),
    eth: web3.utils.toWei('10'),
    external: web3.utils.toWei('10'),
    periodLength: 0,
    periods: 1,
    beneficiary: accounts[1].address,
    externalTokenAddress: externalTokenAddress
  })

  await voteOnProposal({
    proposalId: executedProposalId,
    outcome: PASS,
    voter: accounts[0].address,
    daoInfo,
    web3
  })

  await voteOnProposal({
    proposalId: executedProposalId,
    outcome: PASS,
    voter: accounts[1].address,
    daoInfo,
    web3
  })

  await voteOnProposal({
    proposalId: executedProposalId,
    outcome: PASS,
    voter: accounts[2].address,
    daoInfo,
    web3
  })

  await voteOnProposal({
    proposalId: executedProposalId,
    outcome: PASS,
    voter: accounts[3].address,
    daoInfo,
    web3
  })

  return {
    gsProposalId,
    queuedProposalId,
    preBoostedProposalId,
    boostedProposalId,
    executedProposalId
  }
}

async function submitGSProposal ({
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

async function submitProposal ({
  avatarAddress,
  descHash,
  rep,
  tokens,
  eth,
  external,
  periodLength,
  periods,
  beneficiary,
  externalTokenAddress,
  contributionRewardAddress,
  web3,
  opts
}) {
  // this.spinner.start('Submitting a new Proposal...')

  // const {
  //   ContributionReward
  // } = this.base

  let tx

  const contributionReward = new web3.eth.Contract(
    require('@daostack/arc/build/contracts/ContributionReward.json').abi,
    contributionRewardAddress,
    opts
  )

  const prop = contributionReward.methods.proposeContributionReward(
    avatarAddress,
    descHash,
    rep,
    [tokens, eth, external, periodLength, periods],
    externalTokenAddress,
    beneficiary
  )

  const proposalId = await prop.call()
  tx = await prop.send()
  // await this.logTx(tx, 'Submit new Proposal.')

  return proposalId
}

async function voteOnProposal ({ proposalId, outcome, voter, daoInfo, web3 }) {
  // this.spinner.start('Voting on proposal...')

  const {
    GenesisProtocol
  } = daoInfo

  let tx

  const genesisProtocol = new web3.eth.Contract(
    require('@daostack/arc/build/contracts/GenesisProtocol.json').abi,
    GenesisProtocol,
    opts
  )

  tx = await genesisProtocol.methods
    .vote(proposalId, outcome, 0, voter)
    .send({ from: voter })

  // await this.logTx(tx, 'Voted on Proposal.')
}

async function stakeOnProposal ({ proposalId, outcome, staker, amount, daoInfo, web3 }) {
  // this.spinner.start('Staking on proposal...')

  const {
    GenesisProtocol
  } = daoInfo 

  let tx

  const genesisProtocol = new web3.eth.Contract(
    require('@daostack/arc/build/contracts/GenesisProtocol.json').abi,
    GenesisProtocol,
    opts
  )

  tx = await genesisProtocol.methods
    .stake(proposalId, outcome, amount)
    .send({ from: staker })

  // await this.logTx(tx, 'Staked on Proposal.')
}

async function increaseTime (duration, web3) {
  const id = await Date.now()
  web3.providers.HttpProvider.prototype.sendAsync = web3.providers.HttpProvider.prototype.send

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [duration],
      id
    }, (err1) => {
      if (err1) { return reject(err1) }

      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: id + 1
      }, (err2, res) => {
        return err2 ? reject(err2) : resolve(res)
      })
    })
  })
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
