# test_env

This repository contains a set of scripts to create and publish docker images that are used for testing in
the DAOstack stack: `@daostack/client` and `@doastack/alchemy`

# usage

`./release.sh` will create a new release, which will run the following steps:

1. (re)start fresh docker containers for ipfs, postgres, graph-node, ganache
1. deploy the contracts, DAOs, proposals, etc to ganache using `npm run deploy-ethereum`
1. build a subgraph that indexes these using `npm run deploy-subgraph`
1. tag and publish the docker contains to dockerhub
