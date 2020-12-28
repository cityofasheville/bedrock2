# Bedrock 2

Bedrock is a system for strategic data asset inventory and dependency management.  The purpose of the Bedrock system is to support the strategic use of data. In particular, the system attempts to automate as much as possible maintaining an up-to-date inventory of strategic data assets and their dependencies, maintaining up-to-date versions of the data itself, and supporting access both to the data and to information about it (metadata).

Bedrock focuses on two types of data:

 - Data that we want to manage as strategic assets for reporting or performance management
 - Data that is used for integrating systems

What these two types have in common is a need for a managed interface between the systems or processes that generate the data and those that make use of it. As much as possible, systems that use the data should be able to remain ignorant of the details of how it is extracted or maintained, other than what is captured in metadata to support its use.

Bedrock may be viewed as (a) a set of conventions for maintaining data and metadata, (b) deployable AWS infrastructure for running ETL jobs and other functions, and (c) a command-line tool for working with data assets and for deploying and running the Bedrock AWS infrastructure.

The assets managed by Bedrock are maintained in the [managed-data-assets repository](https://github.com/cityofasheville/managed-data-assets), which is automatically synchronized to an S3 bucket. The Bedrock code references this bucket via the environment variable _BEDROCK_BUCKETNAME_.

Additional information about Bedrock and its use can be found in the __docs__ directory.

## Contents and Organization

As a command-line tool, Bedrock is built on the [Cement CLI Application Framework](https://builtoncement.com/), and the organization of the code is largely determined by Cement. Bedrock-specific code may be found in the _controllers_, _src_, and _aws_ subdirectories [./bedrock/](./bedrock). 

Commands in Cement are implemented using controllers in the [controllers](./bedrock/controllers) directory. Bedrock-specific controllers have the prefix _bedrock___. The commands use functions defined in the [src](./bedrock/src) directory to carry out much of the work.

AWS infrastructure for Bedrock is defined in the [aws](./bedrock/aws) directory.

## Usage

Preprocess assets in BEDROCK_BUCKETNAME for ETL runs:

    bedrock preprocess -o s3  

Create a database table based on a blueprint (the two following lines are equivalent)

    bedrock blueprint create-table -c mdastore1 -b employee.1.0 -t internal2.ejtmp  
    bedrock blueprint create-table --connection=mdastore1 --blueprint=employee.1.0 --table=internal2.ejtmp

Create a blueprint file based on an existing database table:

    bedrock blueprint  create-blueprint -c mdastore1 -t internal2.pr_employee_info -b testblueprint

## Development and Deployment

Bedrock will work relatively easily on most Linux architectures, but the base environment is the Amazon Linux 2 environment defined by the [Dockerfile.bedrock](./Dockerfile.bedrock) file. To build and run on Windows, for example (Mac should be equivalent, without the need for _winpty):

    docker build -f Dockerfile.bedrock --tag ejaxonavl/bedrock .
    winpty docker run -it -v "C:\Users\ericjackson\dev\bedrock\bedrock2":/home/bedrock ejaxonavl/bedrock bash

A _bedrock_ Conda environment is automatically activated on login. Once logged in, run the following:

    cd /home/bedrock
    pip install -r requirements.txt
    python setup.py develop
    export BEDROCK_BUCKETNAME=managed-data-assets

TBD - documentation on deploying and running AWS infrastructure.
