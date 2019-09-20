const fs = require('fs')
const path = require('path')
const Subgraph = require('@daostack/subgraph');

void async function() {
  Subgraph.setupEnv({
    migrationFile: path.resolve('./migration.json'),
    daosDir: path.resolve('./daos'),
    subgraphName: 'daostack',
    // subgraphLocation: path.resolve('./subgraph.yaml')
  })
}();
