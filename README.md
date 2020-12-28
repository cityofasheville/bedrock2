# Bedrock 2

Bedrock is a system for strategic data asset inventory and dependency management.  The purpose of the Bedrock system is to support the strategic use of data. In particular, the system attempts to automate as much as possible maintaining an up-to-date inventory of strategic data assets and their dependencies, maintaining up-to-date versions of the data itself, and supporting access both to the data and to information about it (metadata).

# What data is Bedrock responsible for?
Bedrock focuses on two types of data:
 - Data that we want to manage as strategic assets for reporting or performance management
 - Data that is used for integrating systems
What these two types have in common is a need for a managed interface between the systems or processes that generate the data and those that make use of it. As much as possible, systems that use the data should be able to remain ignorant of the details of how it is extracted or maintained, other than what is captured in metadata to support its use.
In the particular case of an application database (whether the application is third-party or custom), this means that the dependencies between Bedrock and data in that database lie only in the views/APIs provided by those systems for data extraction and any additional processing that needs to be done to conform the data to our internal standards or needs. Bedrock is not responsible for the maintenance of those views or for the application database itself, but it does provide the standard to which extracted data must conform. Bedrock becomes responsible for the particular dataset only after it has been extracted and transformed.
In the case of Google sheets, the interface is effectively a contract between Bedrock and the people, process or system that maintains the spreadsheet.


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

 bedrock blueprint  create-blueprint -c munis -t amd.pr_employee_info -b tstmun
