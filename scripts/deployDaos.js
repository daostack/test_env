const { deployDao } = require('./deployDao')

async function deployDaos() {
  await deployDao('dutchx-params.json')
  await deployDao('migration-params.json')
  await deployDao('nectardao-params.json')
  await deployDao('testdao-params.json')
}

if (require.main === module) {
  deployDaos()
    .catch((err) => { console.error(err); process.exit(1); })
}

module.exports = { deployDaos }
