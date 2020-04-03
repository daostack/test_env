const { migrateDAO } = require('@daostack/migration-experimental')
const config = require('./config')

async function deployDao(daoFileName, options) {
  if (!require.resolve(`../daos/${daoFileName}`)) {
    throw new Error(`Cannot find file ${__dirname}/../daos/${daoFileName}`)
  }

  if (!options) {
    options = { ...config }
  }

  options.params = require(`../daos/${daoFileName}`)

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
