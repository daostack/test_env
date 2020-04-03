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

migration_version=$(cat node_modules/@daostack/subgraph-experimental/package.json  | jq -r '.devDependencies."@daostack/migration-experimental"')
docker_compose_migration_version=$(cat docker-compose.yml | grep daostack/migration-experimental | cut -d ":" -f 3 | sed "s/'//")
package_version=$(cat package.json | jq -r '.version')
image_version=$package_version

# TODO: uncomment if versioning is changed to directly link arc->migration->subgraph together, currently versions can be missaligned
# check if config is ok
# if [[ $docker_compose_migration_version != $migration_version ]]; then
  # echo "The migration version in the docker-compose file is not the same as the one in package.json of the subgraph dependency ($docker_compose_migration_version != $migration_version)"
  # exit
# fi

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

npm run deploy-daos

echo "waiting for graph-node to start"
set +x
while [[ ! "$(curl -s -o /dev/null -w ''%{http_code}'' 127.0.0.1:8000)" =~ ^(200|302)$ ]]; do sleep 5; done
set -x

if [[ $skip_install != 1 ]]; then
  cd node_modules/@daostack/subgraph-experimental
  rm -rf node_modules # must do this to workaround a bug
  npm i
  cd ../../../
fi
npm run deploy-subgraph

set +x
echo "waiting for subgraph to finish indexing"
while [[ $(curl --silent -H "Content-Type: application/json" -d '{"query":"{ subgraphs (where: { name:\"daostack\"}) { id name currentVersion { deployment { synced }}}}","variables":null,"operationName":null}' -X POST http://localhost:8000/subgraphs \
  | jq -r '.data.subgraphs[0].currentVersion.deployment.synced') \
  != true ]]; \
  do sleep 5; done
echo "subgraph is done indexing"

echo "Image version: $image_version"

if [[ $devmode == 1 ]]; then
  echo "we are in devmode, so we are not published the new images to docker hub"
fi

if [[ $devmode != 1 ]]; then
  package_name=$(cat package.json | jq -r '.name' | sed 's/\@//g')

  echo "publish new docker images"
  # commit the ganache image
  container_id=$(docker ps  -f "name=ganache" -l -q)
  image_name=$package_name-ganache
  echo "docker commit $container_id $image_name:$image_version"
  docker commit $container_id $image_name:$image_version
  echo "docker push $image_name:$image_version"
  docker push $image_name:$image_version

  # commit the postgres image
  container_id=$(docker ps  -f "name=postgres" -l -q)
  image_name=$package_name-postgres
  echo "docker commit $container_id $image_name:$image_version"
  docker commit $container_id $image_name:$image_version
  echo "docker push $image_name:$image_version"
  docker push $image_name:$image_version

  # commit the ipfs  image
  container_id=$(docker ps  -f "name=ipfs" -l -q)
  image_name=$package_name-ipfs
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
