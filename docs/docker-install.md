## Installation on Docker

Bedrock will work on most Linux architectures, but we have standardized on Amazon Linux 2023, which can be run as a Docker container defined by [Dockerfile.bedrock](./Dockerfile.bedrock). This will install Python, Node, and AWS tools, as well as clone this repository.

Make_variables file: Use build_mode=std and the architecture of your host system.

To build and run:
```
    docker build -f Dockerfile.bedrock --tag cityofasheville/bedrock .
    docker run -it -v .:/home/bedrock cityofasheville/bedrock bash
```

This command maps ```/home/bedrock``` to the specified directory on your local machine so that you can edit the files on your local machine while running Bedrock in the Docker container.

To build Bedrock after logging into the Docker container set up the AWS environment by running the following commands.
You will need AdministratorAccess command line permissions to AWS.

```
    export AWS_ACCESS_KEY_ID="_<Access_Key_ID>_"
    export AWS_SECRET_ACCESS_KEY="_<Secred_Access_Key>_"
    export AWS_SESSION_TOKEN="_<Session Token>_"
```

Alternatively, you may set up a profile in the AWS credentials file (see documentation [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-profiles)).

Follow the build directions [here](./docs/deploy-notes.md). 

### Getting started with Docker

A simple way to install Docker on a Mac is using Homebrew.
Colima (https://github.com/abiosoft/colima) is a minimal open source Docker runtime.

- brew install docker
- brew install colima
- colima start

After that you should be able to run docker commands in the terminal.