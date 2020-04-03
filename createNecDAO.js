// const utils = require('./utils.js')
const fs = require('fs');
const path = require('path');
const { migrateDAO } = require('@daostack/migration')

async function createNectarDAO(options) {
  const arcVersion = '0.0.1-rc.32'
  // get the params suitable for v32
  options.params = require('./nectardao-params-v32.json')
  options.arcVersion = arcVersion
  const result = await migrateDAO(options)
  return result
}


/**
 * if called directly, run this function
 */
async function main() {
  const { options } = require('./deployEthereum')
  let migration = createNectarDAO(options);
}

if (require.main === module) {
  main().then(console.log(`done`)).catch(err => {console.error(err);process.exit(1)})
} else {
  module.exports = { createNectarDAO}
}
