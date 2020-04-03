const path = require('path')

module.exports = {
  arcVersion: require('@daostack/migration-experimental/package.json').dependencies['@daostack/arc-experimental'],
  quiet: false,
  disableconfs: false,
  force: true,
  restart: true,
  provider: 'http://localhost:8545',
  prevmigration: path.normalize(path.join(__dirname, '../node_modules/@daostack/migration-experimental/migration.json')),
  output: path.normalize(path.join(__dirname, '../migration.json')),
}
