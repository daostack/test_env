const fs = require('fs');
const path = require('path');
const { migrateDAO } = require('@daostack/migration')

// default options passed to the DAOCreator scripts
const options = {
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
  params: JSON.parse(fs.readFileSync(path.join(__dirname, 'migration-params.json'))),
  restart: true
};

// where to write the information of the deployed daos
// const DAOS_DIR = path.resolve(`./daos/private`)
const DAOS_DIR = path.resolve('./node_modules/@daostack/subgraph/daos/private')

async function deployDaos() {
  let migrationInfo, daoInfo, expectedName

  /**
   * CREATE NECTAR DAO rc.32
   */
  expectedName = 'Nectar DAO'
  console.log(`Creating Nectar DAO - version rc.32`);
  options.arcVersion = '0.0.1-rc.32'
  options.params = require('./nectardao-params-v32.json')
  migrationInfo = await migrateDAO(options)
  // do a sanity check 
  daoInfo = migrationInfo['dao'][options.arcVersion];
  if (daoInfo.name !== expectedName) {
    let msg = `Unexpected DAO name: expected "${expectedName}", found ${daoInfo.name}; perhaps you specified the wrong version (in the code ehre above?)`;
    throw Error(msg);
  }
  await fs.writeFileSync(path.join(DAOS_DIR, 'nectardao.json'), JSON.stringify(daoInfo, null, 4));
  console.log(`Done creating Nectar DAO`);




  /**
   * CREATE NECTAR DAO rc.34
   */
  expectedName = 'Nectar DAO rc.34'
  console.log(`Creating ${expectedName}`);
  options.arcVersion = '0.0.1-rc.34'
  options.params = require('./nectardao-params-rc.34.json')
  migrationInfo = await migrateDAO(options)
  daoInfo = migrationInfo['dao'][options.arcVersion];
  
  // do a sanity check just 
  if (daoInfo.name !== expectedName) {
    let msg = `Unexpected DAO name: expected "${expectedName}", found ${daoInfo.name}; perhaps you specified the wrong version (in the code ehre above?)`;
    throw Error(msg);
  }
  await fs.writeFileSync(path.join(DAOS_DIR, 'nectardao-rc.34.json'), JSON.stringify(daoInfo, null, 4));
  console.log(`Done creating ${expectedName}`);

  /**
   * CREATE DAO For Multicall
   */
  expectedName = 'DAO For Multicall'
  console.log(`Creating ${expectedName}`);
  options.arcVersion = '0.0.1-rc.47'
  options.params = require('./testdao-multicall-params-v47.json')
  migrationInfo = await migrateDAO(options)
  daoInfo = migrationInfo['dao'][options.arcVersion];
  
  // do a sanity check just 
  if (daoInfo.name !== expectedName) {
    let msg = `Unexpected DAO name: expected "${expectedName}", found ${daoInfo.name}; perhaps you specified the wrong version (in the code ehre above?)`;
    throw Error(msg);
  }
  await fs.writeFileSync(path.join(DAOS_DIR, 'multi-call-dao-rc.47.json'), JSON.stringify(daoInfo, null, 4));
  console.log(`Done creating ${expectedName}`);

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
  options.arcVersion = '0.0.1-rc.32'
  const { createDutchXDAO } = require('./createDutchXDAO');
  const dutchXCreateInfo = await createDutchXDAO(options);

  console.log(dutchXCreateInfo)
  const dutchXDAOInfo = dutchXCreateInfo['dao'][options.arcVersion];
  if (dutchXDAOInfo.name !== 'DutchX DAO') {
    let msg = `Unexpected DAO name: expected "DutchX DAO", found ${dutchXDAOInfo.name}; perhaps you specified the wrong version (in the code ehre above?)`;
    throw Error(msg);
  }
  // write data to the daos directory where the subgraph deployment can find it
  // await fs.writeFileSync(path.normalize(path.join(__dirname, 'node_modules/@daostack/subgraph/daos/private/dutchxdao.json')), JSON.stringify(dutchXDAOInfo, null, 4));
  await fs.writeFileSync(path.join(DAOS_DIR, 'dutchxdao.json'), JSON.stringify(dutchXDAOInfo, null, 4));
  console.log(`Done creating DutchX DAO`);


}
if (require.main === module) {
  deployDaos().catch((err) => { console.error(err); process.exit(1);});
}

module.exports = { options }
