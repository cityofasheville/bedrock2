## Installation on Docker

Bedrock will work on most Linux architectures, but we have standardized on Amazon Linux 2, which can be run as a Docker container defined by [Dockerfile.bedrock](./Dockerfile.bedrock). This will install Python, Node, PostgreSQL and AWS tools, as well as clone this repository.

To build, run and log in on Windows (changing the tag and local directory appropriately):
```
    docker build -f Dockerfile.bedrock --tag ejaxonavl/bedrock .
    winpty docker run -it -v "C:\Users\ericjackson\dev\bedrock\bedrock2":/home/bedrock ejaxonavl/bedrock bash
```

This command maps ```/home/bedrock``` to the specified directory on your local machine so that you can edit the files on your local machine while running Bedrock in the Docker container.

To build Bedrock after logging into the Docker container for the first time, run the following commands (note that a Conda Python environment called  _bedrock_ is automatically activated on login):

    cd /home/bedrock/scripts
    pip install -r requirements.txt
    export BEDROCK_BUCKETNAME=managed-data-assets

Next set up the AWS environment by running the following commands:

```
    export AWS_ACCESS_KEY_ID="_<Access_Key_ID>_"
    export AWS_SECRET_ACCESS_KEY="_<Secred_Access_Key>_"
    export AWS_SESSION_TOKEN="_<Session Token>_"
```

Alternatively, you may set up a profile in the AWS credentials file (see documentation [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-profiles)).


