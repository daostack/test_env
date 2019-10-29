#!/bin/bash
echo "Creating a new release"
set -x # echo on
set -e # exit on error

while getopts "h?d" opt; do
    case "$opt" in
      h|\?)
        echo "create and publish a new release. Pass the option -d to run without restarting and publishing in th docker containers"
        exit 0
        ;;
      d)  devmode=1
        echo "running in devmode"
        ;;
      f)  output_file=$OPTARG
        ;;
    esac
done

migration_version=$(cat package.json  | jq -r '.dependencies."@daostack/migration"')
docker_compose_migration_version=$(cat docker-compose.yml | grep daostack/migration | cut -d ":" -f 3 | sed "s/'//")
package_version=$(cat package.json | jq -r '.version')
image_version=$migration_version-$package_version

# check if config is ok
if [[ $docker_compose_migration_version != $migration_version ]]; then
  echo "The migration version in the docker-compose file is not the same as the one in package.json ($docker_compose_migration_version != $migration_version)"
  exit
fi

echo "Starting fresh docker containers..."
docker-compose down -v
docker-compose up -d

# clean up local environment
rm -f migration.json
rm -f subgraph.yaml
rm -f scheme.graphql
rm -rf daos/private/*



echo "waiting for ganache to start"
set +x
while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' 127.0.0.1:8545)" != "400" ]]; do sleep 5; done
set -x


# copy the migration file from the migration repo
echo "deploying ethereum contracts and doing transactions...."
docker-compose exec  ganache cat migration.json > migration.json
npm run deploy-ethereum

cd node_modules/@daostack/subgraph
rm -rf node_modules # must do this to workaround a bug
npm i

echo "waiting for graph-node to start"
set +x
while [[ ! "$(curl -s -o /dev/null -w ''%{http_code}'' 127.0.0.1:8000)" =~ ^(200|302)$ ]]; do sleep 5; done
set -x
npm run deploy

# go back to the script directory
# echo "$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd ../../../
echo pwd
cp node_modules/@daostack/subgraph/subgraph.yaml .
cp node_modules/@daostack/subgraph/schema.graphql .

echo "waiting for subgraph to finish indexing"
while [[ $(curl --silent -H "Content-Type: application/json" -d '{"query":"{ subgraphs (where: { name:\"daostack\"}) { id name currentVersion { deployment { synced }}}}","variables":null,"operationName":null}' -X POST http://localhost:8000/subgraphs \
  | jq -r '.data.subgraphs[0].currentVersion.deployment.synced') \
  != true ]]; \
  do sleep 5; done
echo "subgraph is synced"


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
  # git add migration.json
  # git commit `release of version $image_name:$image_version`
  git tag -a $image_version -m "Release of version $image_name:$image_version"
  git push --tags
  # done

  docker-compose down -v
  echo "Done!"
fi
