const { deployDao } = require('./deployDao')
const { deployDemoDao } = require('./deployDemoDao')
const { createCommons } = require('./createCommon')
const fs = require('fs')

function logDao(dao, output) {
  const version = Object.keys(dao.dao)[0]

  if (!output.daos) {
    output.daos = { }
  }

  if (!output.daos[version]) {
    output.daos[version] = []
  }

  output.daos[version].push(dao.dao[version])
}

function logDemo(demo, output) {
  const version = Object.keys(demo.test)[0]

  if (!output.demo) {
    output.demo = { }
  }

  if (!output.demo[version]) {
    output.demo[version] = []
  }

  output.demo[version] = demo.test[version]
}

async function deployDaos() {
  const output = { }
  logDao(await deployDao('dutchx-params.json'), output)
  logDao(await deployDao('migration-params.json'), output)
  logDao(await deployDao('nectardao-params.json'), output)
  logDao(await deployDao('testdao-params.json'), output)
  logDemo(await deployDemoDao(), output)
  fs.writeFileSync(__dirname + '/../daos.json', JSON.stringify(output, null, 2))
  await createCommons()
}

if (require.main === module) {
  deployDaos()
    .catch((err) => { console.error(err); process.exit(1); })
}

module.exports = { deployDaos }
