## Workaround to Docker bug
Deploying Python Lambdas using "sam" cross compilation has stopped working in new versions of Docker for Mac.
    "Error: Docker is unreachable. Docker needs to be running to build inside a container."

#### Solution
Before running make apply, run this at command line

    export DOCKER_HOST=unix://$HOME/.docker/run/docker.sock


https://github.com/aws/aws-sam-cli/issues/4329#issuecomment-1289588827

(Hopefully this file is just temporary)