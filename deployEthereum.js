const fs = require('fs');
const path = require('path');
const VERSION = '0.0.1-rc.32'

// options passed to the DAOCreator scripts
const options = {
  arcVersion: VERSION,
  quiet: false,
  disableconfs: false,
  force: true,
  provider: 'http://localhost:8545',
  // this is the private key used by ganache when running with `--deterministic`
  privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
  prevmigration: path.normalize(path.join(__dirname, 'node_modules/@daostack/migration/migration.json')),
  // prevmigration: path.normalize(path.join(__dirname, './migration.json')),
  output: path.normalize(path.join(__dirname, 'node_modules/@daostack/migration/migration.json')),
  // output: path.normalize(path.join(__dirname, './migration.json')),
  params: JSON.parse(fs.readFileSync(path.join(__dirname, 'migration-params.json')))
};

// where to write the information of the deployed daos
// const DAOS_DIR = path.resolve(`./daos/private`)
const DAOS_DIR = path.resolve('./node_modules/@daostack/subgraph/daos/private')

async function deployDaos() {
  // const DAOstackMigration = require('@daostack/migration');


  /**
   * CREATE TEST DAO
   */
  // THIS CODE bREAKS THE SUBGRAPH (v36-2)
  // console.log(`Creating Test DAO`);
  // const createTestDAO = require('./createTestDAO');
  // let testmigrationDAOInfo = await createTestDAO(options);
  // const testDAOInfo = testmigrationDAOInfo['dao'][options.arcVersion];
  // // do not save a `testdao.json` as that name is already taken..
  // await fs.writeFileSync(path.join(DAOS_DIR, 'testdao2.json'), JSON.stringify(testDAOInfo, null, 4));
  // console.log(`Done creating Test DAO`);
  /**
   * CREATE DUTCHX DAO
   */
  console.log(`Creating DutchX DAO`);
  const { createDutchXDAO } = require('./createDutchXDAO');
  const dutchXCreateInfo = await createDutchXDAO(options);

  console.log(dutchXCreateInfo)
  const dutchXDAOInfo = dutchXCreateInfo['dao'][options.arcVersion];
  if (dutchXDAOInfo.name !== 'DutchX DAO') {
    let msg = `Unexpected DAO name: expected "DutchX DAO", found ${dutchXDAOInfo.name}; perhaps you specified the wrong version (in the code ehre above?)`;
    throw Error(msg);
  }
  // dutchXDAOInfo.arcVersion = VERSION;
  // write data to the daos directory where the subgraph deployment can find it
  // await fs.writeFileSync(path.normalize(path.join(__dirname, 'node_modules/@daostack/subgraph/daos/private/dutchxdao.json')), JSON.stringify(dutchXDAOInfo, null, 4));
  await fs.writeFileSync(path.join(DAOS_DIR, 'dutchxdao.json'), JSON.stringify(dutchXDAOInfo, null, 4));
  console.log(`Done creating DutchX DAO`);

  /**
   * CREATE NECTAR DAO
   */
  console.log(`Creating Nectar DAO`);
  const { createNectarDAO } = require('./createNecDAO');
  const migrationInfo = await createNectarDAO(options);
  // write data to the daos directory where the subgraph deployment can find it

  const nectarDAOInfo = migrationInfo['dao'][options.arcVersion];
  if (nectarDAOInfo.name !== 'Nectar DAO') {
    let msg = `Unexpected DAO name: expected "Nectar DAO", found ${nectarDAOInfo.name}; perhaps you specified the wrong version (in the code ehre above?)`;
    throw Error(msg);
  }
  nectarDAOInfo.arcVersion = VERSION;
  await fs.writeFileSync(path.join(DAOS_DIR, 'nectardao.json'), JSON.stringify(nectarDAOInfo, null, 4));
  console.log(`Done creating Nectar DAO`);




}
if (require.main === module) {
  deployDaos().catch((err) => { console.error(err); process.exit(1);});
}

module.exports = { options, VERSION }