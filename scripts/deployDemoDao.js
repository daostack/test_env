const config = require('./config')
const { migrateDAO } = require('@daostack/migration-experimental')
const Web3 = require('web3')

var adjectives = ['adamant', 'adroit', 'amatory', 'animistic', 'antic', 'arcadian', 'baleful', 'bellicose', 'bilious', 'boorish', 'calamitous', 'caustic', 'cerulean', 'comely', 'concomitant', 'contumacious', 'corpulent', 'crapulous', 'defamatory', 'didactic', 'dilatory', 'dowdy', 'efficacious', 'effulgent', 'egregious', 'endemic', 'equanimous', 'execrable', 'fastidious', 'feckless', 'fecund', 'friable', 'fulsome', 'garrulous', 'guileless', 'gustatory', 'heuristic', 'histrionic', 'hubristic', 'incendiary', 'insidious', 'insolent', 'intransigent', 'inveterate', 'invidious', 'irksome', 'jejune', 'jocular', 'judicious', 'lachrymose', 'limpid', 'loquacious', 'luminous', 'mannered', 'mendacious', 'meretricious', 'minatory', 'mordant', 'munificent', 'nefarious', 'noxious', 'obtuse', 'parsimonious', 'pendulous', 'pernicious', 'pervasive', 'petulant', 'platitudinous', 'precipitate', 'propitious', 'puckish', 'querulous', 'quiescent', 'rebarbative', 'recalcitant', 'redolent', 'rhadamanthine', 'risible', 'ruminative', 'sagacious', 'salubrious', 'sartorial', 'sclerotic', 'serpentine', 'spasmodic', 'strident', 'taciturn', 'tenacious', 'tremulous', 'trenchant', 'turbulent', 'turgid', 'ubiquitous', 'uxorious', 'verdant', 'voluble', 'voracious', 'wheedling', 'withering', 'zealous']
var nouns = ['ninja', 'chair', 'pancake', 'statue', 'unicorn', 'rainbows', 'laser', 'senor', 'bunny', 'captain', 'nibblets', 'cupcake', 'carrot', 'gnomes', 'glitter', 'potato', 'salad', 'toejam', 'curtains', 'beets', 'toilet', 'exorcism', 'stick figures', 'mermaid eggs', 'sea barnacles', 'dragons', 'jellybeans', 'snakes', 'dolls', 'bushes', 'cookies', 'apples', 'ukulele', 'kazoo', 'banjo', 'opera singer', 'circus', 'trampoline', 'carousel', 'carnival', 'locomotive', 'hot air balloon', 'animator', 'artisan', 'artist', 'colorist', 'inker', 'coppersmith', 'director', 'designer', 'flatter', 'stylist', 'leadman', 'limner', 'make-up artist', 'model', 'musician', 'penciller', 'producer', 'scenographer', 'silversmith', 'teacher', 'beader', 'foreman', 'maintenance', 'engineering', 'mechanic', 'miller', 'moldmaker', 'panel beater', 'patternmaker', 'plant operator', 'plumber', 'sawfiler', 'shop foreman', 'soaper', 'wheelwright', 'woodworkers']

const randomEl = (list) => {
  var i = Math.floor(Math.random() * list.length)
  return list[i]
}

const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const generateRandomName = () => {
  return capitalize(randomEl(adjectives)) + ' ' + capitalize(randomEl(nouns))
}

async function assignGlobalVariables (arcVersion, provider, prevmigration) {
  this.arcVersion = arcVersion
  this.package = require(prevmigration).private.package[this.arcVersion]

  this.web3 = new Web3(provider)

  // Set the default account
  try {
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

    for (const key of privateKeys) {
      const account = this.web3.eth.accounts.privateKeyToAccount(
        key
      )
      this.web3.eth.accounts.wallet.add(account)

      if (!this.web3.eth.defaultAccount) {
        this.web3.eth.defaultAccount = account.address
      }
    }
  } catch (e) {
    console.error(`Could not obtain an account for migration. Please specify a valid 'private-key' or 'mnemonic'`)
    console.error(e)
    process.exit(1)
  }

  // Set the opts
  const block = await this.web3.eth.getBlock('latest')
  this.opts = {
    from: this.web3.eth.defaultAccount,
    gas: block.gasLimit
  }

  this.logTx = async ({ transactionHash, gasUsed }, msg) => {
    const transaction = await this.web3.eth.getTransaction(transactionHash)
    if (transaction != null) {
      const gasPrice = transaction.gasPrice
      const txCost = this.web3.utils.fromWei((gasUsed * gasPrice).toString(), 'ether')
      console.log(`${transactionHash} | ${Number(txCost).toFixed(5)} ETH | ${msg}`)
    }
  }
}

async function deployDemoDao () {
  const {
    arcVersion,
    provider,
    prevmigration
  } = config

  await assignGlobalVariables(arcVersion, provider, prevmigration)

  if (!this.package) {
    const msg = `Couldn't find existing package migration ('migration.json' > 'package').`
    console.error(msg)
    throw new Error(msg)
  }

  const ActionMock = await new this.web3.eth.Contract(
    require(`@daostack/migration-experimental/contracts/${this.arcVersion}/ActionMock.json`).abi,
    undefined,
    this.opts
  ).deploy({
    data: require(`@daostack/migration-experimental/contracts/${this.arcVersion}/ActionMock.json`).bytecode
  }).send()

  const orgName = generateRandomName()
  const params = {
    orgName,
    tokenName: orgName + ' Token',
    tokenSymbol: orgName[0] + orgName.split(' ')[1][0] + 'T',
    tokenCap: 0,
    metaData: 'metadata',
    VotingMachinesParams: [
      {
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
    ],
    Schemes: [
      {
        name: 'ContributionReward',
        alias: 'ContributionRewardAlias',
        permissions: '0x00000000',
        params: [
          'GenesisProtocolAddress',
          { voteParams: 0 }
        ]
      },
      {
        name: 'GenericScheme',
        alias: 'GenericSchemeAlias',
        permissions: '0x00000010',
        params: [
          'GenesisProtocolAddress',
          { voteParams: 0 },
          ActionMock.options.address
        ]
      },
      {
        name: 'SchemeRegistrar',
        alias: 'SchemeRegistrarAlias',
        permissions: '0x0000001F',
        params: [
          'GenesisProtocolAddress',
          { voteParams: 0 },
          { voteParams: 0 }
        ]
      }
    ],
    StandAloneContracts: [
      {
        name: "DAOToken",
        fromArc: true,
        params: [
          'DemoToken',
          'DTN',
          0,
          this.opts.from
        ]
      },
      {
        name: "Reputation",
        fromArc: true,
        params: [
          this.opts.from
        ]
      },
      {
        name: "Avatar",
        fromArc: true,
        params: [
          'DemoAvatar',
          { StandAloneContract: 0 },
          { StandAloneContract: 1 },
          this.opts.from
        ]
      }
    ],
    founders: [
      {
        address: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
        tokens: 1000,
        reputation: 1000
      },
      {
        address: "0xffcf8fdee72ac11b5c542428b35eef5769c409f0",
        tokens: 1000,
        reputation: 1000
      },
      {
        address: "0x22d491bde2303f2f43325b2108d26f1eaba1e32b",
        tokens: 1000,
        reputation: 1000
      },
      {
        address: "0xe11ba2b4d45eaed5996cd0823791e0c93114882d",
        tokens: 1000,
        reputation: 1000
      },
      {
        address: "0xd03ea8624c8c5987235048901fb614fdca89b117",
        tokens: 1000,
        reputation: 1000
      },
      {
        address: "0x95ced938f7991cd0dfcb48f0a06a40fa1af46ebc",
        tokens: 1000,
        reputation: 1000
      }
    ]
  }

  console.log('Migrating Demo Test...')

  let accounts = this.web3.eth.accounts.wallet

  const {
    DAORegistryInstance,
    GenesisProtocol,
    GEN
  } = this.package

  const GENToken = await new this.web3.eth.Contract(
    require(`@daostack/migration-experimental/contracts/${this.arcVersion}/DAOToken.json`).abi,
    GEN,
    this.opts
  )

  for (let i = 0; i < accounts.length; i++) {
    await GENToken.methods.approve(
      GenesisProtocol,
      this.web3.utils.toWei('1000')
    ).send({ from: accounts[i].address })
  }

  const externalTokenAddress = await migrateExternalToken()

  const migration = await migrateDAO({
    ...config,
    params
  })

  const {
    Avatar,
    Schemes,
    StandAloneContracts
  } = migration.dao[arcVersion]

  const ContributionReward = Schemes[0].address

  const {
    queuedProposalId,
    preBoostedProposalId,
    boostedProposalId,
    executedProposalId
  } = await submitDemoProposals(accounts, web3, ContributionReward, externalTokenAddress)

  let network = await this.web3.eth.net.getNetworkType()
  if (network === 'private') {
    if (await web3.eth.net.getId() === 100) {
      network = 'xdai'
    } else if (await web3.eth.net.getId() === 77) {
      network = 'sokol'
    }
  }

  if (network === 'private') {
    const daoRegistry = await new this.web3.eth.Contract(
      require(`@daostack/migration-experimental/contracts/${this.arcVersion}/DAORegistry.json`).abi,
      DAORegistryInstance,
      this.opts
    )
    console.log('Registering DAO in DAORegistry')
    let tx = await daoRegistry.methods.propose(Avatar).send()
    tx = await daoRegistry.methods.register(Avatar, orgName).send()
    await this.logTx(tx, 'Finished Registering DAO in DAORegistry')
  }

  let result = { 'test': {} }
  result.test[this.arcVersion] = {
    dao: migration.dao[arcVersion],
    queuedProposalId,
    preBoostedProposalId,
    boostedProposalId,
    executedProposalId,
    organs: {
      DemoAvatar: StandAloneContracts[2].address,
      DemoDAOToken: StandAloneContracts[0].address,
      DemoReputation: StandAloneContracts[1].address,
      ActionMock: ActionMock.options.address
    }
  }
  return result
}

async function migrateExternalToken () {
  console.log('Migrating External Token...')

  const externalToken = await new this.web3.eth.Contract(
    require(`@daostack/migration-experimental/contracts/${this.arcVersion}/DAOToken.json`).abi,
    undefined,
    this.opts
  ).deploy({
    data: require(`@daostack/migration-experimental/contracts/${this.arcVersion}/DAOToken.json`).bytecode,
    arguments: ['External', 'EXT', 0]
  }).send()

  return externalToken.options.address
}

async function submitDemoProposals (accounts, web3, crAddress, externalTokenAddress) {
  const [PASS, FAIL] = [1, 2]
  // QUEUED PROPOSAL //
  let queuedProposalId = await submitProposal({
    crAddress,
    descHash: '0x000000000000000000000000000000000000000000000000000000000000abcd',
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

  // PRE BOOSTED PROPOSAL //
  let preBoostedProposalId = await submitProposal({
    crAddress,
    descHash: '0x000000000000000000000000000000000000000000000000000000000000efgh',
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

  // BOOSTED PROPOSAL //
  let boostedProposalId = await submitProposal({
    crAddress,
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

  // EXECUTED PROPOSAL //
  let executedProposalId = await submitProposal({
    crAddress,
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
    gsProposalId: 0,
    queuedProposalId,
    preBoostedProposalId,
    boostedProposalId,
    executedProposalId
  }
}

async function submitProposal ({
  crAddress,
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
  console.log('Submitting a new Proposal...')

  let tx

  const contributionReward = await new this.web3.eth.Contract(
    require(`@daostack/migration-experimental/contracts/${this.arcVersion}/ContributionReward.json`).abi,
    crAddress,
    this.opts
  )

  const prop = contributionReward.methods.proposeContributionReward(
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
  console.log('Voting on proposal...')

  const {
    GenesisProtocol
  } = this.package

  let tx

  const genesisProtocol = await new this.web3.eth.Contract(
    require(`@daostack/migration-experimental/contracts/${this.arcVersion}/GenesisProtocol.json`).abi,
    GenesisProtocol,
    this.opts
  )

  tx = await genesisProtocol.methods
    .vote(proposalId, outcome, 0, voter)
    .send({ from: voter })

  await this.logTx(tx, 'Voted on Proposal.')
}

async function stakeOnProposal ({ proposalId, outcome, staker, amount }) {
  console.log('Staking on proposal...')

  const {
    GenesisProtocol
  } = this.package

  let tx

  const genesisProtocol = await new this.web3.eth.Contract(
    require(`@daostack/migration-experimental/contracts/${this.arcVersion}/GenesisProtocol.json`).abi,
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

if (require.main === module) {
  deployDemoDao()
    .catch((err) => { console.error(err); process.exit(1); })
}

module.exports = { deployDemoDao }
