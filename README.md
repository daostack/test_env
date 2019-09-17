# test_env

Test environment setup. This repository is used to create docker images that can be used for testing the DAOstack stack.

The published images can be found at:
-  https://hub.docker.com/r/daostack/test-env/tags : runs Ganache with the deployed contracts
-  https://hub.docker.com/r/daostack/subgraph-postgres/tags : runs Ganache with the deployed contracts
-  https://hub.docker.com/r/daostack/subgraph-ipfs/tags : runs Ganache with the deployed contracts

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
- edit `docker-compose.yml` and update the `@daostack/migration` image. This image already has the DAOStack base contracts deployed
- (re)-start the docker containers: `docker-compose up graph-node`. You will now have a graphql server running on `http://127.0.0.1:8000`
- `npm run migrate` deploy some DAOs and other contracts (in addition to those already available from the `@daostack/migration` image. If the `Arc` version has changed, this script may break. If so, fix it.
- `npm run deploy-subgraph`: will deploy the subgraph.  `http://127.0.0.1:8000`
