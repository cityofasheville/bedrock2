# Bedrock 2

Second version of the Bedrock system.

cd /home/bedrock
conda create -n bedrock python=3.9
conda activate bedrock
pip install requirements.txt
python setup.py develop

## Using the Docker Development Machine
docker build -f Dockerfile.devmachine --tag ejaxonavl/devmachine .
docker build -f Dockerfile.bedrock --tag ejaxonavl/bedrock .

### To log in
winpty docker run -it -v "C:\Users\ericjackson\dev\bedrock\bedrock2":/home/bedrock ejaxonavl/bedrock bash

### Other useful commands
docker images
docker ps -a
docker image prune
docker container prune