# Bedrock 2
![LOGO](./docs/bedrock.png)

Bedrock is a system for strategic data asset inventory and dependency management, as well as automation of the most common mechanisms for copying or transforming data. Bedrock focuses on two types of data:

 - Data for reporting or performance management
 - Data used for integrating systems

What these two types have in common is a need for a managed interface between the systems or processes that generate the data and those that make use of it. As much as possible, systems that use the data should be able to remain ignorant of the details of how it is extracted or maintained, other than what is captured in metadata to support its use.

Bedrock works in conjunction with the data inventory itself, which is maintained in the [managed-data-assets repository](https://github.com/cityofasheville/managed-data-assets).


## Contents and Organization

Bedrock consists of a combination of command-line scripts and AWS infrastructure.

As a command-line tool, Bedrock is built on the [Cement CLI Application Framework](https://builtoncement.com/), and the organization of the code is largely determined by Cement. Bedrock-specific code may be found in the _controllers_, _src_, and _aws_ subdirectories of [./bedrock/](./bedrock). 

AWS infrastructure for Bedrock is defined in the [aws](./bedrock/aws) directory.

## Usage

Preprocess assets in BEDROCK_BUCKETNAME for ETL runs:

    bedrock preprocess -o s3  

### Blueprints
Create a database table based on a blueprint (the two following lines are equivalent)

    bedrock blueprint create-table -c mdastore1 -b employee.1.0 -t internal2.ejtmp  
    bedrock blueprint create-table --connection=mdastore1 --blueprint=employee.1.0 --table=internal2.ejtmp

Create a blueprint file based on an existing database table:

    bedrock blueprint  create-blueprint -c mdastore1 -t internal2.pr_employee_info -b testblueprint

### Deploying Bedrock AWS Infrastructure
 
TBD - documentation on deploying and running AWS infrastructure.

## Installation, Development and Deployment

## Installation on Docker

Bedrock will work on most Linux architectures, but we have standardized on Amazon Linux 2, which can be run as a Docker container defined by [Dockerfile.bedrock](./Dockerfile.bedrock). This will install Python, Node, PostgreSQL and AWS tools, as well as clone this repository.

To build, run and log in on Windows (changing the tag and local directory appropriately):
```
    docker build -f Dockerfile.bedrock --tag ejaxonavl/bedrock .
    winpty docker run -it -v "C:\Users\ericjackson\dev\bedrock\bedrock2":/home/bedrock ejaxonavl/bedrock bash
```
The ```winpty``` command is not required on a Mac.

A Conda Python environment called  _bedrock_ is automatically activated on login. After logging in the first time, run the following commands:

    cd /home/bedrock
    pip install -r requirements.txt
    python setup.py develop
    export BEDROCK_BUCKETNAME=managed-data-assets

Next set up the AWS environment by running the following commands:

```
    export AWS_ACCESS_KEY_ID="_<Access_Key_ID>_"
    export AWS_SECRET_ACCESS_KEY="_<Secred_Access_Key>_"
    export AWS_SESSION_TOKEN="_<Session Token>_"
```

Alternatively, you may set up a profile in the AWS credentials file (see documentation [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-profiles)).


