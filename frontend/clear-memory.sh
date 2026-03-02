docker container prune -f
docker image rm $(docker image ls -q)
docker network rm $(docker network ls -q)
docker volume rm $(docker volume ls -q)
