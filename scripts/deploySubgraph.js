const Subgraph = require('@daostack/subgraph-experimental')

async function deploySubgraph() {
  Subgraph.setupEnv({
    subgraphName: 'daostack'
  })
}

if (require.main === module) {
  deploySubgraph()
    .catch((err) => { console.error(err); process.exit(1); })
}

module.exports = { deploySubgraph }
