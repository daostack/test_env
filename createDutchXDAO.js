// const utils = require('./utils.js')
const { migrateDAO } = require('@daostack/migration')

async function createDutchXDAO(options) {
  options.params = require('./dutchx-params.json')
  const result = await migrateDAO(options)
  return result
}

module.exports = { createDutchXDAO }
