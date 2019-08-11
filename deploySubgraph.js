const fs = require('fs')
const path = require('path')

void async function() {
  const Subgraph = require('@daostack/subgraph');
  Subgraph.setupEnv({
    migrationFile: path.resolve('./migration.json'),
    subgraphName: 'daostack'
  })
}();
