# test_env

Test environment setup. This repository is used to create docker images that can be used for testing the DAOstack stack, for example in  `@daostack/client` and `@doastack/alchemy`

# The test environment


The test environment consists of 3 (strictly related) docker images:

The images created with the code in this repo can be found at:
* https://hub.docker.com/r/daostack/test-env : an image with ganache with a large number of deployed contracts
* https://hub.docker.com/r/daostack/subgraph-postgres : a postgres image to use with graph-node, that contains a subgraph called `daostack` that indexes the contracts in the `test_env` image
* https://hub.docker.com/r/daostack/subgraph-ipfs : an ipfs image which contains the proposal data and the subgraph definition

These images can be used as in the examples https://github.com/daostack/client/blob/master/docker-compose.yml and https://github.com/daostack/alchemy/blob/master/docker-compose.yml

## What you need

- `npm`
- `docker`

## Instructions

Create and release new images for a new [Arc](https://github.com/daostack/arc/)/[subgraph](https://github.com/daostack/subgraph/) combo.

- find the latest subgraph relase: https://www.npmjs.com/package/@daostack/subgraph
- find the corresponding package versions  for `@daostack/arc` and `@daostack/migration` in https://github.com/daostack/subgraph/blob/master/package-lock.json
- edit `package.json` and update the `@daostack/subgraph`, `@daostack/migration` and `daostack/arc` dependencies
- run `npm install`
- edit `docker-compose.yml` and update the `graphprotocl/graph-node` and the `daostack/migration` image. This image already has the DAOStack base contracts deployed
- (re)-start the docker containers: `docker-compose up graph-node`. You will now have a graph server running on `http://127.0.0.1:8000`, but it will not have any subgraphs deployed to it yet.
- `npm run migrate` deploy some DAOs and other contracts (in addition to those already available from the `@daostack/migration` image. If the `Arc` version has changed, this script may break. If so, fix it.
- `npm run deploy-subgraph`: will generate and deploy the subgraph.  `http://127.0.0.1:8000`

`./release.sh` will create a new release, which will run the following steps:

1. (re)start fresh docker containers for ipfs, postgres, graph-node, ganache
1. deploy the contracts, DAOs, proposals, etc to ganache using `npm run deploy-ethereum`
1. build a subgraph that indexes these using `npm run deploy-subgraph`
1. tag and publish the docker contains to dockerhub

to run the deploy-to-ethereum-and-index-what-you-deployed without actually publishing the images, run `./release.sh -d` (`d` for `devmode`)

## available accounts

There are 10 available test accounts - these are the usual ganache test accounts. They have hold some ETH and GEN.
