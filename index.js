const Ganache = require('ganache-cli')
const path = require('path')

const defaults = {
  db_path: path.normalize(path.join(__dirname, './db')),
  // default ganache-cli mnemonic (https://github.com/trufflesuite/ganache-cli/blob/develop/cli.js#L45)
  seed: 'TestRPC is awesome!'
}

const migration = require(path.normalize(path.join(__dirname, './migration.json')))

module.exports = {
  Ganache: {
    server: opts => Ganache.server({ ...defaults, ...opts }),
    provider: opts => Ganache.provider({ ...defaults, ...opts })
  },
  migration: network => {
    if (network in migration) {
      return migration[network]
    } else {
      throw new Error(`Could not retreive migration result for network ${network}`)
    }
  },
  ...require('@daostack/migration-experimental/migrate')
}
