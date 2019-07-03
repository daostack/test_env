#!/bin/bash
echo "Creating a new release"
npm ci

migration_version=$(cat package.json  | jq -r '.dependencies."@daostack/migration"')
docker_compose_migration_version=$(cat docker-compose.yml | grep daostack/migration | cut -d ":" -f 3 | sed "s/'//")
package_version=$(cat package.json | jq -r '.version')
image_version=ganache-$migration_version-$package_version

if [[ $docker_compose_migration_version != $migration_version ]]; then
  echo "The migration version in the docker-compose file is not the same as the one in package.json ($docker_compose_migration_version != $migration_version)"
  exit
fi

echo "(Re)bulding docker containers..."
docker-compose down -v
docker-compose build
docker-compose up -d

# wait a bit for graph-node to come (it will redirect with a 302)
echo "waiting for ganache to start"
sleep 10

echo "migrating test environment"
npm run migrate

# commit the postgres image
container_id=$(docker ps  -f "name=ganache" -l -q)
image_name=daostack/test-env
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
