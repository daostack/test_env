# test_env

This repository is used to create docker images that can be used for testing the DAOstack stack, for example in  `@daostack/client` and `@doastack/alchemy`

# The test environment


The test environment consists of 3 (related) docker images:

* https://hub.docker.com/r/daostack/test-env : an image with ganache with a large number of deployed contracts
* https://hub.docker.com/r/daostack/subgraph-ipfs : an ipfs image which contains the proposal data and the subgraph definition
* https://hub.docker.com/r/daostack/subgraph-postgres : a postgres image to use with graph-node, that contains the data of a subgraph called `daostack` that indexes the contracts in the `test_env` image

## Using the package


These setups look like this:
(for updated examples refer to https://github.com/daostack/client/blob/master/docker-compose.yml and https://github.com/daostack/alchemy/blob/master/docker-compose.yml)

1. Create a file named `docker-compose.yml` with the contents below
2. Run `docker-compose up graph-node`
3. Visit the subgraph at

```
version: "3"
services:
  graph-node:
    image: 'graphprotocol/graph-node@sha256:8af6adc44d6c55eaed7f6d3ac2b96af0823044e94ffee380288f07e96d5ff30b'
    ports:
      - 8000:8000
      - 8001:8001
      - 8020:8020
    links:
      - ipfs
      - postgres
      - ganache
    environment:
      postgres_host: postgres:5432
      postgres_user: postgres
      postgres_pass: 'letmein'
      postgres_db: postgres
      ipfs: ipfs:5001
      ethereum: private:http://ganache:8545
      GRAPH_LOG: "graph.log"
      GRAPH_GRAPHQL_MAX_FIRST: 1000

  ipfs:
    image: daostack/subgraph-ipfs:0.0.1-rc.36-v1-3.0.19
    ports:
      - 5001:5001

  postgres:
    image: daostack/subgraph-postgres:0.0.1-rc.36-v1-3.0.19
    ports:
      - 9432:5432
    environment:
      POSTGRES_PASSWORD: 'letmein'

  ganache:
    image: daostack/test-env:0.0.1-rc.36-v1-3.0.19
    ports:
      - 8545:8545
```


## What you need

- `npm`
- `docker`

## Create a new release

`./release.sh` will create a new release, which will run the following steps:

1. (re)start fresh docker containers for ipfs, postgres, graph-node, ganache
1. deploy the contracts, DAOs, proposals, etc to ganache using `npm run deploy-daos`
1. build a subgraph that indexes these using `npm run deploy-subgraph`
1. tag and publish the docker contains to dockerhub


`./release.sh -d` will run the script in development mode, which will run all the steps except publish the result on docker hub


## Instructions

Create and release new images for a new [Arc](https://github.com/daostack/arc/)/[subgraph](https://github.com/daostack/subgraph/) combo.

- find the latest subgraph relase: https://www.npmjs.com/package/@daostack/subgraph
- find the corresponding package versions for `@daostack/migration` in https://github.com/daostack/subgraph/blob/master/package-lock.json
- edit `package.json` and update the `@daostack/subgraph` and `@daostack/migration` dependencies
- run `npm install`
- edit `docker-compose.yml` and update the `graphprotocl/graph-node` (to match what is in the subgraph package.json) and the `daostack/migration` image. This image already has the DAOStack base contracts deployed
- (re)-start the docker containers: `docker-compose up graph-node`. You will now have a graph server running on `http://127.0.0.1:8000`, but it will not have any subgraphs deployed to it yet.
- `npm run migrate` deploy some DAOs and other contracts (in addition to those already available from the `@daostack/migration` image. If the `Arc` version has changed, this script may break. If so, fix it.
- `npm run deploy-subgraph`: will generate and deploy the subgraph.  `http://127.0.0.1:8000`


## available accounts

There are 10 available test accounts - these are the usual ganache test accounts. They have hold some ETH and GEN.
