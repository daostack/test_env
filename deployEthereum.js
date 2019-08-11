const fs = require('fs')
const path = require('path')

const options = {
  quiet: false,
  disableconfs: false,
  force: true,
  provider: 'http://localhost:8545',
  // this is the private key used by ganache when running with `--deterministic`
  privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
  // prevmigration: path.normalize(path.join(__dirname, 'node_modules/@daostack/migration/migration.json')),
  prevmigration: path.normalize(path.join(__dirname, './migration.json')),
  output: path.normalize(path.join(__dirname, './migration.json')),
  params: JSON.parse(fs.readFileSync(path.join(__dirname, 'migration-params.json')))
}

void async function() {
  const DAOstackMigration = require('@daostack/migration');
  const setupTestEnv = require('./setup-test-env')
  // await DAOstackMigration.migrateBase(options)
  await DAOstackMigration.migrateScript(setupTestEnv)(options)
}();
