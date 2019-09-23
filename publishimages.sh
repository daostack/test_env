migration_version=$(cat package.json  | jq -r '.dependencies."@daostack/migration"')
package_version=$(cat package.json | jq -r '.version')
image_version=$migration_version-$package_version
docker-compose up -d
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

# docker-compose down -v
echo "Done!"
