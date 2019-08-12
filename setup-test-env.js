const utils = require('@daostack/migration/utils')
const IPFSClient = require('ipfs-http-client');
const ipfs = '/ip4/127.0.0.1/tcp/5001';

async function assignGlobalVariables (web3, spinner, opts, logTx, previousMigration) {
  this.arcVersion = require('./package.json').dependencies['@daostack/arc']
  this.web3 = previousMigration
  this.web3 = web3
  this.spinner = spinner
  this.opts = opts
  this.logTx = logTx
  this.base = previousMigration.base[this.arcVersion]
}

async function migrateDemoTest ({ web3, spinner, confirm, opts, migrationParams, logTx, previousMigration }) {
  // if (!(await confirm('About to migrate new Demo Test. Continue?'))) {
  //   return
  // }

  assignGlobalVariables(web3, spinner, opts, logTx, previousMigration)

  if (!this.base) {
    const msg = `Couldn't find existing base migration ('migration.json' > 'base').`
    this.spinner.fail(msg)
    throw new Error(msg)
  }

  this.spinner.start('Migrating Demo Test...')

  let accounts = this.web3.eth.accounts.wallet

  const {
    GenesisProtocol,
    GEN,
    UController
  } = this.base

  const GENToken = await new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/DAOToken.json').abi,
    GEN,
    this.opts
  )

  web3.eth.accounts.wallet.clear()

  let privateKeys = [
    '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
    '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c',
    '0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913',
    '0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743',
    '0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd',
    '0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52',
    '0xa453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3',
    '0x829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4',
    '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773'
  ]

  for (let i = 0; i < privateKeys.length; i++) {
    web3.eth.accounts.wallet.add(web3.eth.accounts.privateKeyToAccount(privateKeys[i]))
    await GENToken.methods.mint(web3.eth.accounts.wallet[i].address, web3.utils.toWei('1000')).send()
  }

  for (let i = 0; i < accounts.length; i++) {
    await GENToken.methods.approve(GenesisProtocol, this.web3.utils.toWei('1000')).send({ from: accounts[i].address })
  }

  const externalTokenAddress = await migrateExternalToken()

  const randomName = utils.generateRnadomName()
  const [orgName, tokenName, tokenSymbol, founders, tokenDist, repDist, cap] = [
    randomName,
    randomName + ' Token',
    randomName[0] + randomName.split(' ')[1][0] + 'T',
    migrationParams.founders.map(({ address }) => address),
    migrationParams.founders.map(({ tokens }) => web3.utils.toWei(tokens.toString())),
    migrationParams.founders.map(({ reputation }) => web3.utils.toWei(reputation.toString())),
    '0'
  ]

  const avatarAddress = await migrateDemoDao(orgName, tokenName, tokenSymbol, founders, tokenDist, repDist, cap)

  const gpParamsHash = await setGenesisProtocolParams()

  const crParamsHash = await setContributionRewardParams(gpParamsHash) // FIXME

  const ActionMock = await migrateActionMock()

  const gsParamsHash = await setGenericSchemeParams(gpParamsHash, ActionMock) // FIXME

  const srParamsHash = await setSchemeRegistrarParams(gpParamsHash) // FIXME

  let repFromTokenScheme = await migrateReputationFromTokenScheme(avatarAddress)
  const schemes = [
    {
      address: this.base.ContributionReward,
      params: crParamsHash,
      permissions: '0x00000000' /* no special params */
    },
    {
      address: this.base.GenericScheme,
      params: gsParamsHash,
      permissions: '0x00000010'
    },
    {
      address: this.base.SchemeRegistrar,
      params: srParamsHash,
      permissions: '0x0000001F'
    },
    {
      address: repFromTokenScheme,
      params: '0x0000000000000000000000000000000000000000000000000000000000000000',
      permissions: '0x00000001'
    }
  ]

  await setSchemes(schemes, avatarAddress, 'metaData')

  const {
    gsProposalId,
    queuedProposalId,
    preBoostedProposalId,
    boostedProposalId,
    executedProposalId
  } = await submitDemoProposals(accounts, web3, avatarAddress, externalTokenAddress, ActionMock)

  const avatar = new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/Avatar.json').abi,
    avatarAddress,
    this.opts
  )

  const Avatar = avatarAddress
  const DAOToken = await avatar.methods.nativeToken().call()
  const Reputation = await avatar.methods.nativeReputation().call()

  const DemoDAOToken = await new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/DAOToken.json').abi,
    undefined,
    this.opts
  ).deploy({
    data: require('@daostack/arc/build/contracts/DAOToken.json').bytecode,
    arguments: ['DemoToken', 'DTN', 0]
  }).send()

  const DemoReputation = await new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/Reputation.json').abi,
    undefined,
    this.opts
  ).deploy({
    data: require('@daostack/arc/build/contracts/Reputation.json').bytecode
  }).send()

  const DemoAvatar = await new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/Avatar.json').abi,
    undefined,
    this.opts
  ).deploy({
    data: require('@daostack/arc/build/contracts/Avatar.json').bytecode,
    arguments: ['DemoAvatar', DemoDAOToken.options.address, DemoReputation.options.address]
  }).send()
  let migration = { 'test': previousMigration.test || {} }
  migration.test[this.arcVersion] = {
    name: orgName,
    Avatar,
    DAOToken,
    Reputation,
    Controller: UController,
    Schemes: {
      ReputationFromToken: repFromTokenScheme
    },
    ActionMock,
    gsProposalId,
    queuedProposalId,
    preBoostedProposalId,
    boostedProposalId,
    executedProposalId,
    organs: {
      DemoAvatar: DemoAvatar.options.address,
      DemoDAOToken: DemoDAOToken.options.address,
      DemoReputation: DemoReputation.options.address
    }
  }
  return migration
}

async function migrateExternalToken () {
  this.spinner.start('Migrating External Token...')

  const externalToken = await new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/DAOToken.json').abi,
    undefined,
    this.opts
  ).deploy({
    data: require('@daostack/arc/build/contracts/DAOToken.json').bytecode,
    arguments: ['External', 'EXT', 0]
  }).send()

  return externalToken.options.address
}

async function migrateDemoDao (orgName, tokenName, tokenSymbol, founders, tokenDist, repDist, cap) {
  this.spinner.start('Creating a new organization...')

  const {
    UController,
    DaoCreator
  } = this.base

  let tx

  const daoCreator = new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/DaoCreator.json').abi,
    DaoCreator,
    this.opts
  )

  const forge = daoCreator.methods.forgeOrg(
    orgName,
    tokenName,
    tokenSymbol,
    founders,
    tokenDist,
    repDist,
    UController,
    cap
  )

  const avatarAddress = await forge.call()
  tx = await forge.send()
  await this.logTx(tx, 'Created new organization.')

  return avatarAddress
}

async function submitDemoProposals (accounts, web3, avatarAddress, externalTokenAddress, actionMockAddress) {
  const [PASS, FAIL] = [1, 2]
  const actionMock = await new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/ActionMock.json').abi,
    actionMockAddress,
    this.opts
  )

  let callData = await actionMock.methods.test2(avatarAddress).encodeABI()

  let proposalIPFSData = {
    description: 'Execute Action Proposal',
    title: 'A modest proposal',
    url: 'http://swift.org/modest',
  };

  let descHash = await writeProposalIPFS(proposalIPFSData);
  let gsProposalId = await submitGSProposal({
    avatarAddress: avatarAddress,
    callData,
    descHash
  })

  proposalIPFSData = {
    description: 'Queued Contribution Proposal',
    title: 'Reward contributor proposal',
    url: 'http://swift.org/modest',
  };

  descHash = await writeProposalIPFS(proposalIPFSData);

  // QUEUED PROPOSAL //
  let queuedProposalId = await submitProposal({
    avatarAddress: avatarAddress,
    descHash,
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
    proposalId: queuedProposalId,
    outcome: FAIL,
    voter: accounts[2].address
  })

  await voteOnProposal({
    proposalId: queuedProposalId,
    outcome: PASS,
    voter: accounts[1].address
  })

  proposalIPFSData = {
    description: 'Pre Boosted Contribution Proposal',
    title: 'Second reward contributor proposal',
    url: 'http://swift.org/modest',
  };

  descHash = await writeProposalIPFS(proposalIPFSData);
  // PRE BOOSTED PROPOSAL //
  let preBoostedProposalId = await submitProposal({
    avatarAddress: avatarAddress,
    descHash,
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
    proposalId: preBoostedProposalId,
    outcome: PASS,
    staker: accounts[1].address,
    amount: this.web3.utils.toWei('1000')
  })

  proposalIPFSData = {
    description: 'Boosted Contribution Proposal',
    title: 'Third reward contributor proposal',
    url: 'http://swift.org/modest',
  };

  descHash = await writeProposalIPFS(proposalIPFSData);

  // BOOSTED PROPOSAL //
  let boostedProposalId = await submitProposal({
    avatarAddress: avatarAddress,
    descHash,
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
    amount: this.web3.utils.toWei('1000')
  })

  await voteOnProposal({
    proposalId: boostedProposalId,
    outcome: PASS,
    voter: accounts[1].address
  })

  await increaseTime(259300, web3)

  await voteOnProposal({
    proposalId: boostedProposalId,
    outcome: PASS,
    voter: accounts[0].address
  })

  proposalIPFSData = {
    description: 'Executed Contribution Proposal',
    title: 'Forth reward contributor proposal',
    url: 'http://swift.org/modest',
  };

  descHash = await writeProposalIPFS(proposalIPFSData);
  // EXECUTED PROPOSAL //
  let executedProposalId = await submitProposal({
    avatarAddress: avatarAddress,
    descHash,
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
    voter: accounts[0].address
  })

  await voteOnProposal({
    proposalId: executedProposalId,
    outcome: PASS,
    voter: accounts[1].address
  })

  await voteOnProposal({
    proposalId: executedProposalId,
    outcome: PASS,
    voter: accounts[2].address
  })

  await voteOnProposal({
    proposalId: executedProposalId,
    outcome: PASS,
    voter: accounts[3].address
  })

  return {
    gsProposalId,
    queuedProposalId,
    preBoostedProposalId,
    boostedProposalId,
    executedProposalId
  }
}

async function migrateActionMock () {
  this.spinner.start('Deploying Action Mock...')

  const actionMock = await new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/ActionMock.json').abi,
    undefined,
    this.opts
  ).deploy({
    data: require('@daostack/arc/build/contracts/ActionMock.json').bytecode
  }).send()

  return actionMock.options.address
}

async function migrateReputationFromTokenScheme (avatarAddress) {
  let { abi: externalTokenLockerMockABI, bytecode: externalTokenLockerMockBytecode } = require('@daostack/arc/build/contracts/ExternalTokenLockerMock.json')
  spinner.start('Migrating ExternalTokenLockerMock...')
  const externalTokenLockerMockContract = new web3.eth.Contract(externalTokenLockerMockABI, undefined, opts)
  const externalTokenLockerMockDeployedContract = externalTokenLockerMockContract.deploy({
    data: externalTokenLockerMockBytecode,
    arguments: null
  }).send()
  tx = await new Promise(resolve => externalTokenLockerMockDeployedContract.on('receipt', resolve))
  const externalTokenLockerMock = await externalTokenLockerMockDeployedContract
  await logTx(tx, `${externalTokenLockerMock.options.address} => ExternalTokenLockerMock`)

  let { abi: reputationFromTokenABI, bytecode: reputationFromTokenBytecode } = require('@daostack/arc/build/contracts/ReputationFromToken.json')
  spinner.start('Migrating ReputationFromToken...')
  const reputationFromTokenContract = new web3.eth.Contract(reputationFromTokenABI, undefined, opts)
  const reputationFromTokenDeployedContract = reputationFromTokenContract.deploy({
    data: reputationFromTokenBytecode,
    arguments: null
  }).send()
  tx = await new Promise(resolve => reputationFromTokenDeployedContract.on('receipt', resolve))
  const reputationFromToken = await reputationFromTokenDeployedContract
  await logTx(tx, `${reputationFromToken.options.address} => ReputationFromToken`)

  spinner.start('Setting ReputationFromToken...')

  const reputationFromTokenInit = reputationFromToken.methods.initialize(
    avatarAddress,
    externalTokenLockerMock.options.address,
    '0x0000000000000000000000000000000000000000'
  )
  tx = await reputationFromTokenInit.send()
  await logTx(tx, 'Reputation From Token Scheme Initialized.')
  return reputationFromToken.options.address
}

async function setContributionRewardParams (gpParamsHash) {
  this.spinner.start('Setting Contribution Reward Parameters...')

  const {
    ContributionReward,
    GenesisProtocol
  } = this.base

  let tx

  const contributionReward = new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/ContributionReward.json').abi,
    ContributionReward,
    this.opts
  )

  const crSetParams = contributionReward.methods.setParameters(
    gpParamsHash,
    GenesisProtocol
  )

  const crParamsHash = await crSetParams.call()
  tx = await crSetParams.send()
  await this.logTx(tx, 'Contribution Reward Set Parameters.')

  return crParamsHash
}

async function setGenericSchemeParams (gpParamsHash, actionMock) {
  this.spinner.start('Setting Generic Scheme Parameters...')

  const {
    GenericScheme,
    GenesisProtocol
  } = this.base

  let tx

  const genericScheme = new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/GenericScheme.json').abi,
    GenericScheme,
    this.opts
  )

  const gsParams = {
    contractToCall: actionMock
  }

  const gsSetParams = genericScheme.methods.setParameters(
    gpParamsHash,
    GenesisProtocol,
    gsParams.contractToCall
  )

  const gsParamsHash = await gsSetParams.call()
  tx = await gsSetParams.send()
  await this.logTx(tx, 'Generic Scheme Set Parameters.')

  return gsParamsHash
}

async function setSchemeRegistrarParams (gpParamsHash) {
  this.spinner.start('Setting Scheme Registrar Parameters...')

  const {
    SchemeRegistrar,
    GenesisProtocol
  } = this.base

  let tx

  const schemeRegistrar = new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/SchemeRegistrar.json').abi,
    SchemeRegistrar,
    this.opts
  )

  const srSetParams = schemeRegistrar.methods.setParameters(
    gpParamsHash,
    gpParamsHash,
    GenesisProtocol
  )

  const srParamsHash = await srSetParams.call()
  tx = await srSetParams.send()
  await this.logTx(tx, 'Scheme Registrar Set Parameters.')

  return srParamsHash
}

async function setGenesisProtocolParams () {
  this.spinner.start('Setting Genesis Protocol Parameters...')

  const {
    GenesisProtocol
  } = this.base

  let tx

  const genesisProtocol = new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/GenesisProtocol.json').abi,
    GenesisProtocol,
    this.opts
  )

  const gpParams = {
    boostedVotePeriodLimit: 600,
    daoBountyConst: 10,
    minimumDaoBounty: 100,
    queuedVotePeriodLimit: 1800,
    queuedVoteRequiredPercentage: 50,
    preBoostedVotePeriodLimit: 600,
    proposingRepReward: 5,
    quietEndingPeriod: 300,
    thresholdConst: 2000,
    voteOnBehalf: '0x0000000000000000000000000000000000000000',
    votersReputationLossRatio: 1,
    activationTime: 0
  }

  const gpSetParams = genesisProtocol.methods.setParameters(
    [
      gpParams.queuedVoteRequiredPercentage,
      gpParams.queuedVotePeriodLimit,
      gpParams.boostedVotePeriodLimit,
      gpParams.preBoostedVotePeriodLimit,
      gpParams.thresholdConst,
      gpParams.quietEndingPeriod,
      this.web3.utils.toWei(gpParams.proposingRepReward.toString()),
      gpParams.votersReputationLossRatio,
      this.web3.utils.toWei(gpParams.minimumDaoBounty.toString()),
      gpParams.daoBountyConst,
      gpParams.activationTime
    ],
    gpParams.voteOnBehalf
  )

  const gpParamsHash = await gpSetParams.call()

  tx = await gpSetParams.send()
  await this.logTx(tx, 'Genesis Protocol Set Parameters.')

  return gpParamsHash
}

async function setSchemes (schemes, avatarAddress, metadata) {
  this.spinner.start('Registering Schemes to DAO...')

  const {
    DaoCreator
  } = this.base

  let tx

  const daoCreator = new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/DaoCreator.json').abi,
    DaoCreator,
    this.opts
  )

  tx = await daoCreator.methods.setSchemes(
    avatarAddress,
    schemes.map(({ address }) => address),
    schemes.map(({ params }) => params),
    schemes.map(({ permissions }) => permissions),
    metadata
  ).send()

  await this.logTx(tx, 'Dao Creator Set Schemes.')
}
async function submitGSProposal ({
  avatarAddress,
  callData,
  descHash
}) {
  this.spinner.start('Submitting a new Proposal...')

  const {
    GenericScheme
  } = this.base

  let tx

  const genericScheme = new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/GenericScheme.json').abi,
    GenericScheme,
    this.opts
  )

  const prop = genericScheme.methods.proposeCall(
    avatarAddress,
    callData,
    0,
    descHash
  )

  const proposalId = await prop.call()
  tx = await prop.send()
  await this.logTx(tx, 'Submit new Proposal.')

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
  externalTokenAddress
}) {
  this.spinner.start('Submitting a new Proposal...')

  const {
    ContributionReward
  } = this.base

  let tx

  const contributionReward = new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/ContributionReward.json').abi,
    ContributionReward,
    this.opts
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
  await this.logTx(tx, 'Submit new Proposal.')

  return proposalId
}

async function voteOnProposal ({ proposalId, outcome, voter }) {
  this.spinner.start('Voting on proposal...')

  const {
    GenesisProtocol
  } = this.base

  let tx

  const genesisProtocol = new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/GenesisProtocol.json').abi,
    GenesisProtocol,
    this.opts
  )

  tx = await genesisProtocol.methods
    .vote(proposalId, outcome, 0, voter)
    .send({ from: voter })

  await this.logTx(tx, 'Voted on Proposal.')
}

async function stakeOnProposal ({ proposalId, outcome, staker, amount }) {
  this.spinner.start('Staking on proposal...')

  const {
    GenesisProtocol
  } = this.base

  let tx

  const genesisProtocol = new this.web3.eth.Contract(
    require('@daostack/arc/build/contracts/GenesisProtocol.json').abi,
    GenesisProtocol,
    this.opts
  )

  tx = await genesisProtocol.methods
    .stake(proposalId, outcome, amount)
    .send({ from: staker })

  await this.logTx(tx, 'Staked on Proposal.')
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

async function writeProposalIPFS(data) {
  const ipfsClient = IPFSClient(ipfs);
  const ipfsResponse = await ipfsClient.add(new Buffer(JSON.stringify(data)));

  return ipfsResponse[0].path;
}

module.exports = migrateDemoTest
