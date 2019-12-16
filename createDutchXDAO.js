// const utils = require('./utils.js')
const fs = require('fs');
const path = require('path');
const { migrateDAO } = require('@daostack/migration')

async function createDutchXDAO(options) {
  options.params = require('./dutchx-params.json')
  const result = await migrateDAO(options)
  return result
}

/**
 * if called directly, run this function
 */
async function main() {
  const DAOstackMigration = require('@daostack/migration');
  const options = {
    quiet: false,
    disableconfs: false,
    force: true,
    provider: 'http://localhost:8545',
    // this is the private key used by ganache when running with `--deterministic`
    privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    prevmigration: path.normalize(path.join(__dirname, 'node_modules/@daostack/migration/migration.json')),
    // prevmigration: path.normalize(path.join(__dirname, './migration.json')),
    output: path.normalize(path.join(__dirname, './migration.json')),
    params: JSON.parse(fs.readFileSync(path.join(__dirname, 'migration-params.json')))
  };
  console.log(`starting migration with options`)
  console.log(options)
  let migration = createDutchXDAO(options);

  // migration = migration.test[arcVersion];

  // const testDAOInfo = {
  //     name: migration.name,
  //     Avatar: migration.Avatar,
  //     DAOToken: migration.DAOToken,
  //     Reputation: migration.Reputation,
  //     Controller: migration.Controller,
  //     Schemes: migration.Schemes,
  //     arcVersion
  // };
  // // write data to the daos directory where the subgraph deployment can find it
  // await fs.writeFileSync(path.normalize(path.join(__dirname, 'node_modules/@daostack/subgraph/daos/private/test.json')), JSON.stringify(testDAOInfo, null, 4));
  // console.log(`Done creating DtuchX DAO`);
 
}
if (require.main === module) {
  main().then(console.log(`done`)).catch(err => {console.error(err);process.exit(1)})
} 
module.exports = { createDutchXDAO }
