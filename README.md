# Bedrock 2
![LOGO](./docs/bedrock.png)

Bedrock is a system for strategic data asset inventory and dependency management, as well as automation of the most common mechanisms for copying or transforming data. Bedrock focuses on two types of data:

 - Data for reporting or performance management
 - Data used for integrating systems

What these two types have in common is a need for a managed interface between the systems or processes that generate the data and those that make use of it. As much as possible, systems that use the data should be able to remain ignorant of the details of how it is extracted or maintained, other than what is captured in metadata to support its use.

Bedrock works in conjunction with the data inventory itself, which is maintained in the [managed-data-assets repository](https://github.com/cityofasheville/managed-data-assets).


## Organization

Bedrock consists of two parts, a set of command-line scripts and a collection of AWS infrastructure that implements an ETL system.

### Command-Line Scripts

As a command-line tool, Bedrock is currently built on the [Cement CLI Application Framework](https://builtoncement.com/), and the organization of the code is largely determined by Cement. Bedrock-specific code may be found in the _controllers_, _src_, and _aws_ subdirectories of [./bedrock/](./bedrock). In the near future we will be moving the Bedrock scripts out of the framework.

In the meantime, there are currently just 3 scripts, only one of which is in regular use.

#### preprocess

The ```preprocess``` command combines information on all assets defined in an S3 copy of the  [managed-data-assets repository](https://github.com/cityofasheville/managed-data-assets) into a single ```all_assets.json``` file that is used by the ETL system running in AWS. Currently it must be run manually whenever the repository is updated (a CircleCI job copies the repository to S3, but running ```preprocess``` is manual). To run, set the environment variable ```BEDROCK_BUCKETNAME``` to ```managed-data-assets``` and run the command:

    bedrock preprocess -o s3  

#### Blueprint Commands

In Bedrock a _blueprint_ is the standard representation of an asset that can be used to create a table in a database or validate data at an API interface. For now we only have two commands available, one to create a new blueprint based on an existing table and one to create a table based on a blueprint file.

To create a database table based on a blueprint, run either of these commands (they are equivalent)

    bedrock blueprint create-table -c mdastore1 -b employee.1.0 -t internal2.ejtmp  
    bedrock blueprint create-table --connection=mdastore1 --blueprint=employee.1.0 --table=internal2.ejtmp

To create a blueprint file based on an existing database table:

    bedrock blueprint  create-blueprint -c mdastore1 -t internal2.pr_employee_info -b testblueprint

### Bedrock AWS ETL Infrastructure
 
AWS infrastructure for Bedrock is defined in the [aws](./bedrock/aws) directory.


### OTHER STUFF

#### Installation and Development

#### Installation on Docker

Bedrock will work on most Linux architectures, but we have standardized on Amazon Linux 2, which can be run as a Docker container defined by [Dockerfile.bedrock](./Dockerfile.bedrock). This will install Python, Node, PostgreSQL and AWS tools, as well as clone this repository.

To build, run and log in on Windows (changing the tag and local directory appropriately):
```
    docker build -f Dockerfile.bedrock --tag ejaxonavl/bedrock .
    winpty docker run -it -v "C:\Users\ericjackson\dev\bedrock\bedrock2":/home/bedrock ejaxonavl/bedrock bash
```
The ```winpty``` command is not required on a Mac. This command maps ```/home/bedrock``` to the specified directory on your local machine so that you can edit the files on your local machine while running Bedrock in the Docker container.

To build Bedrock after logging into the Docker container for the first time, run the following commands (note that a Conda Python environment called  _bedrock_ is automatically activated on login):

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


