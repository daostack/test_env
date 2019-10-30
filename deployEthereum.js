const fs = require('fs');
const path = require('path');

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

 async function deployDaos() {
  const DAOstackMigration = require('@daostack/migration');
  // const arcVersion = require('./package.json').dependencies['@daostack/arc']
  const VERSION = require('@daostack/arc/package.json').version;

  console.log(`Creating DutchX DAO`);
  const { createDutchXDAO } = require('./createDutchXDAO');
  const dutchXCreateInfo = await createDutchXDAO(options);
  // write data to the daos directory where the subgraph deployment can find it

  const dutchXDAOInfo = dutchXCreateInfo['dao'][VERSION];
  if (dutchXDAOInfo.name !== 'DutchX DAO') {
    let msg = `Unexpected DAO name: expected "DutchX DAO", found ${dutchXDAOInfo.name}; perhaps you specified the wrong version (in the code ehre above?)`;
    throw Error(msg);
  }
  dutchXDAOInfo.arcVersion = VERSION;
  await fs.writeFileSync(path.normalize(path.join(__dirname, 'node_modules/@daostack/subgraph/daos/private/dutchxdao.json')), JSON.stringify(dutchXDAOInfo, null, 4));
  console.log(`Done creating DutchX DAO`);

  console.log(`Creating Test DAO`);
  const createTestDAO = require('./createTestDAO');
  let migration = (await DAOstackMigration.migrateScript(createTestDAO)(options));

  migration = migration.test[arcVersion];

  const testDAOInfo = {
      name: migration.name,
      Avatar: migration.Avatar,
      DAOToken: migration.DAOToken,
      Reputation: migration.Reputation,
      Controller: migration.Controller,
      Schemes: migration.Schemes,
      arcVersion
  };
  // write data to the daos directory where the subgraph deployment can find it
  await fs.writeFileSync(path.normalize(path.join(__dirname, 'node_modules/@daostack/subgraph/daos/private/test.json')), JSON.stringify(testDAOInfo, null, 4));
  console.log(`Done creating Test DAO`);

  console.log(`Creating Nectar DAO`);
  const { createNectarDAO } = require('./createNecDAO');
  const migrationInfo = await createNectarDAO(options);
  // write data to the daos directory where the subgraph deployment can find it

  const nectarDAOInfo = migrationInfo['dao'][VERSION];
  if (nectarDAOInfo.name !== 'Nectar DAO') {
    let msg = `Unexpected DAO name: expected "Nectar DAO", found ${nectarDAOInfo.name}; perhaps you specified the wrong version (in the code ehre above?)`;
    throw Error(msg);
  }
  nectarDAOInfo.arcVersion = VERSION;
  await fs.writeFileSync(path.normalize(path.join(__dirname, 'node_modules/@daostack/subgraph/daos/private/nectardao.json')), JSON.stringify(nectarDAOInfo, null, 4));
  console.log(`Done creating Nectar DAO`);
}

deployDaos().catch((err) => { console.error(err); process.exit(1);});
