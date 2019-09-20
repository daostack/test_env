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

// function replaceContents(file, replacement, cb) {
//   fs.readFile(replacement, (err, contents) => {
//       if (err) return cb(err);
//       fs.writeFile(file, contents, cb);
//   });
// }

void async function() {
  const DAOstackMigration = require('@daostack/migration');
  const setupTestEnv = require('./setup-test-env')
  const arcVersion = require('./package.json').dependencies['@daostack/arc']

  console.log(options)
  let migration = (await DAOstackMigration.migrateScript(setupTestEnv)(options)).test[arcVersion]

  let dao = {
      name: migration.name,
      Avatar: migration.Avatar,
      DAOToken: migration.DAOToken,
      Reputation: migration.Reputation,
      Controller: migration.Controller,
      Schemes: {
        ReputationFromToken: migration.Schemes.ReputationFromToken
      },
      arcVersion
  }
  await fs.writeFileSync(path.normalize(path.join(__dirname, './daos/private/demodao.json')), JSON.stringify(dao, null, 4))
}();
