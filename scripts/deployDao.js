const { migrateDAO } = require('@daostack/migration-experimental')

const defaultOpts = {
  quiet: false,
  disableconfs: false,
  force: true,
  provider: 'http://localhost:8545',
  // this is the private key used by ganache when running with `--deterministic`
  privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
  prevmigration: path.normalize(path.join(__dirname, 'node_modules/@daostack/migration-experimental/migration.json')),
  output: path.normalize(path.join(__dirname, 'node_modules/@daostack/migration-experimental/migration.json')),
};

async function deployDao(daoFileName, options) {
  if (!require.resolve(`../dao-params/${daoFileName}`)) {
    throw new Error(`Cannot find file ${__dirname}/../dao-params/${daoFileName}`)
  }

  if (!options) {
    options = { ...defaultOpts }
  }

  options.params = require(`../dao-params/${daoFileName}`)

  if (!options.quiet) {
    console.log(`starting migration with options`)
    console.log(options)
  }

  return await migrateDAO(options)
}

async function main() {
  if (process.argv.length < 3) {
    throw new Error('Please provide the name of your DAO as the first argument')
  }

  deployDao(process.argv[2])
}

if (require.main === module) {
  main()
    .then(console.log(`done`))
    .catch(err => { console.error(err); process.exit(1); })
} else {
  module.exports = { deployDao }
}
