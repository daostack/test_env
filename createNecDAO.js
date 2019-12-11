// const utils = require('./utils.js')
const fs = require('fs');
const path = require('path');
const { migrateDAO } = require('@daostack/migration')

async function createNectarDAO(options) {
  options.params = require('./nectardao-params.json')
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
