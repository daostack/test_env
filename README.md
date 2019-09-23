# test_env

This repository contains a set of scripts to create and publish docker images that are used for testing in
the DAOstack stack: `@daostack/client` and `@doastack/alchemy`

# The test environment


The test environment consists of 3 (strictly related) docker images:

* https://hub.docker.com/r/daostack/test-env : an image with ganache with a large number of deployed contracts
* https://hub.docker.com/r/daostack/subgraph-postgres : a postgres image to use with graph-node, that contains a subgraph called `daostack` that indexes the contracts in the `test_env` image
* https://hub.docker.com/r/daostack/subgraph-ipfs : an ipfs image which contains the proposal data and the subgraph definition

This file illustrates the usage: https://github.com/daostack/client/blob/master/docker-compose.yml

## available accounts

There are 10 available test accounts - these are the usual ganache test accounts. They have hold some ETH and GEN.


# Development

`./release.sh` will create a new release, which will run the following steps:

1. (re)start fresh docker containers for ipfs, postgres, graph-node, ganache
1. deploy the contracts, DAOs, proposals, etc to ganache using `npm run deploy-ethereum`
1. build a subgraph that indexes these using `npm run deploy-subgraph`
1. tag and publish the docker contains to dockerhub

## Changing the code

- the typical place to interface is the `deployEthereum.js` script, which deploys DAOs, proposals, etc.
- to run the deploy-to-ethereum-and-index-what-you-deployed without actually publishing the images, run `./release.sh -d` (`d` for `devmode`)
