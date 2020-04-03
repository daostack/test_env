# test_env

This repository is used to create docker images that can be used for testing the DAOstack stack, for example in  `@daostack/client` and `@doastack/alchemy`


The test environment consists of 3 (related) docker images:

* https://hub.docker.com/r/daostack/test-env : an image with ganache with a large number of deployed contracts
* https://hub.docker.com/r/daostack/subgraph-ipfs : an ipfs image which contains the proposal data and the subgraph definition
* https://hub.docker.com/r/daostack/subgraph-postgres : a postgres image to use with graph-node, that contains the data of a subgraph called `daostack` that indexes the contracts in the `test_env` image

## How to use the docker images created in this repository


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
    ports:
      - 5001:5001

  postgres:
    ports:
      - 9432:5432
    environment:
      POSTGRES_PASSWORD: 'letmein'

  ganache:
    image: daostack/test-env:0.0.1-rc.36-v1-3.0.19
    ports:
      - 8545:8545
```
The ganache image 
comes with 10 prefunded ethereum accounts  you can use for testing. These are the usual ganache test accounts. They have hold some ETH and GEN.


## How to create and publish new docker images

`./release.sh` will create a rebuild the images and publish them on dockerlhub.

1. (re)start fresh docker containers for ipfs, postgres, graph-node, ganache
1. deploy the contracts, DAOs, proposals, etc to ganache using `npm run deployEthereum`
1. build a subgraph that indexes these using `npm run deploySubgraph`
1. tag and publish the docker contains to dockerhub


`./release.sh -d` will run the script in development mode, which will run all the steps except publish the result on docker hub. This is useful for testing



## How to create a test_env release for a new `arc` or `subgraph` package 


Create and release new images for a new [Arc](https://github.com/daostack/arc/)/[subgraph](https://github.com/daostack/subgraph/) combo.

- find the latest subgraph relase: https://www.npmjs.com/package/@daostack/subgraph
- find the corresponding package versions for `@daostack/migration` in https://github.com/daostack/subgraph/blob/master/package-lock.json
- edit `package.json` and update the `@daostack/subgraph` and `@daostack/migration` dependencies
- run `npm install`
- edit `docker-compose.yml` and update the `graphprotocl/graph-node` (to match what is in the subgraph package.json) and the `daostack/migration` image. This image already has the DAOStack base contracts deployed
- Run `./release.sh -d` to see if the deployment scripts are working properly.  You may have to change the `deploySubgraph` and/or the `deployEthereum` scripts if there were any changes in `arc` or `subgraph`. You can do a sanity check of the result by checking the data of the graphql server at `http://127.0.0.1:8000`
- if all look swell, run the `./release.sh` script described above.




