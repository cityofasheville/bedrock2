# Build docker image
docker build -f Dockerfile.bedrock --tag cityofasheville/bedrock .

# Run docker image
docker run -it -v .:/home/bedrock cityofasheville/bedrock