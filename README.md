# Bedrock 2

Second version of the Bedrock system.

## Using the Docker Development Machine
docker build -f Dockerfile.devmachine --tag ejaxonavl/devmachine .
winpty docker run -it -v "C:\Users\ericjackson\dev\docker":/home/bedrock ejaxonavl/devmachine sh
docker images
docker ps -a
docker image prune
docker container prune