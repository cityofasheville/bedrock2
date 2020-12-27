# Bedrock 2

Bedrock is a system for strategic data asset inventory and dependency management. 

## What is in this repo?

TBD

## How do you use Bedrock?
The Bedrock system consists of two main parts: a command-line interface and AWS functions that may be invoked from the CLI or via CloudWatch events.

## How do you deploy the Bedrock system?
### Pre-requisites

cd /home/bedrock
pip install -r requirements.txt
python setup.py develop
export BEDROCK_BUCKETNAME=managed-data-assets

## Using the Docker Development Machine
docker build -f Dockerfile.bedrock --tag ejaxonavl/bedrock .

### To log in
winpty docker run -it -v "C:\Users\ericjackson\dev\bedrock\bedrock2":/home/bedrock ejaxonavl/bedrock bash

### Other useful commands
docker images
docker ps -a
docker image prune
docker container prune

## Blueprint
Example:
    bedrock blueprint create-table -c mdastore1 -b employee.1.0 -t internal2.ejtmp
which is equivalent to:
    bedrock blueprint create-table --connection=mdastore1 --blueprint=employee.1.0 --table=internal2.ejtmp
