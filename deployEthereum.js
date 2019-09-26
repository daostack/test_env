const fs = require('fs')
const path = require('path')

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
}

void async function() {
  const DAOstackMigration = require('@daostack/migration');
  // const arcVersion = require('./package.json').dependencies['@daostack/arc']
  const arcVersion = require('@daostack/arc/package.json').version
  console.log(arcVersion)

  console.log(`Creating Test DAO`)
  const createTestDAO = require('./createTestDAO')
  let migration = (await DAOstackMigration.migrateScript(createTestDAO)(options))

  migration = migration.test[arcVersion]

  const testDAOInfo = {
      name: migration.name,
      Avatar: migration.Avatar,
      DAOToken: migration.DAOToken,
      Reputation: migration.Reputation,
      Controller: migration.Controller,
      Schemes: migration.Schemes,
      // Schemes: {
      //   ReputationFromToken: migration.Schemes.ReputationFromToken
      // },
      arcVersion
  }
  // write data to the daos directory where the subgraph deployment can find it
  console.log(testDAOInfo)
  console.log(migration)
  await fs.writeFileSync(path.normalize(path.join(__dirname, './daos/private/test.json')), JSON.stringify(testDAOInfo, null, 4))
  console.log(`Done creating Test DAO`)

  console.log(`Creating NecDAO`)
  const createNecDAO = require('./createNecDAO')
  migration = (await DAOstackMigration.migrateScript(createNecDAO)(options))
  migration = migration.test[arcVersion]


  const nectarDAOInfo = {
      name: migration.name,
      Avatar: migration.Avatar,
      DAOToken: migration.DAOToken,
      Reputation: migration.Reputation,
      Controller: migration.Controller,
      Schemes: migration.Schemes,
      arcVersion
  }
  console.log(nectarDAOInfo)
  // write data to the daos directory where the subgraph deployment can find it
  await fs.writeFileSync(path.normalize(path.join(__dirname, './daos/private/nectardao.json')), JSON.stringify(nectarDAOInfo, null, 4))
  console.log(`Done creating NecDAO`)
}();
