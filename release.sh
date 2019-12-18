#!/bin/bash
echo "Creating a new release"
set -e # exit on error

while getopts "h?dfs" opt; do
    case "$opt" in
      h|\?)
        echo "create and publish a new release. Pass the option -d (for 'devmode') to run without restarting docker or publishing on docker hub"
        exit 0
        ;;
      d)  devmode=1
        echo "running in devmode, will not publish the images in docker hub"
        ;;
      f)  output_file=$OPTARG
        ;;
      s)  skip_install=1
        echo "skip npm install"
        ;;
    esac
done

migration_version=$(cat node_modules/@daostack/subgraph/package.json  | jq -r '.devDependencies."@daostack/migration"')
docker_compose_migration_version=$(cat docker-compose.yml | grep daostack/migration | cut -d ":" -f 3 | sed "s/'//")
package_version=$(cat package.json | jq -r '.version')
image_version=$migration_version-$package_version

# check if config is ok
if [[ $docker_compose_migration_version != $migration_version ]]; then
  echo "The migration version in the docker-compose file is not the same as the one in package.json ($docker_compose_migration_version != $migration_version)"
  exit
fi

echo "Starting fresh docker containers..."
set -x # echo on
docker-compose down -v
docker-compose up -d


set +x
echo "waiting for ganache to start"
while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' 127.0.0.1:8545)" != "400" ]]; do sleep 5; done
set -x


echo "deploying ethereum contracts and doing transactions...."
# clean up local environment
rm -f migration.json
docker-compose exec  ganache cat migration.json > migration.json

npm run deployEthereum

echo "waiting for graph-node to start"
set +x
while [[ ! "$(curl -s -o /dev/null -w ''%{http_code}'' 127.0.0.1:8000)" =~ ^(200|302)$ ]]; do sleep 5; done
set -x

# echo pwd

# # Workaround for the fact that `deploySubgraph.js` does not work with the current package
# this workaround requires that we write all artefacts (like the info of the daos created in deployEthereum) in the node_modules package, which is not so nice :-/
cd node_modules/@daostack/subgraph
# if [[ $skip_install != 1 ]]; then
#   rm -rf node_modules # must do this to workaround a bug
#   npm i
# fi
npm run deploy
cd ../../../
# npm run deploySubgraph



set +x
echo "waiting for subgraph to finish indexing"
while [[ $(curl --silent -H "Content-Type: application/json" -d '{"query":"{ subgraphs (where: { name:\"daostack\"}) { id name currentVersion { deployment { synced }}}}","variables":null,"operationName":null}' -X POST http://localhost:8000/subgraphs \
  | jq -r '.data.subgraphs[0].currentVersion.deployment.synced') \
  != true ]]; \
  do sleep 5; done
echo "subgraph is done indexing"


echo "publish new docker images"
echo "Image name: $image_name:$image_version"

if [[ $devmode != 1 ]]; then
  echo "publish new docker images"
  # commit the ganache image
  container_id=$(docker ps  -f "name=ganache" -l -q)
  image_name=daostack/test-env
  echo "docker commit $container_id $image_name:$image_version"
  docker commit $container_id $image_name:$image_version
  echo "docker push $image_name:$image_version"
  docker push $image_name:$image_version

  # commit the postgres image
  container_id=$(docker ps  -f "name=postgres" -l -q)
  image_name=daostack/subgraph-postgres
  echo "docker commit $container_id $image_name:$image_version"
  docker commit $container_id $image_name:$image_version
  echo "docker push $image_name:$image_version"
  docker push $image_name:$image_version

  # commit the ipfs  image
  container_id=$(docker ps  -f "name=ipfs" -l -q)
  image_name=daostack/subgraph-ipfs
  echo "docker commit $container_id $image_name:$image_version"
  docker commit $container_id $image_name:$image_version
  echo "docker push $image_name:$image_version"
  docker push $image_name:$image_version

  docker-compose down -v
  # tag on github
  echo "create tag ${image_version}"
  git tag -a $image_version -m "Release of version $image_name:$image_version"
  git push --tags
  # done

  echo "Done!"
fi
