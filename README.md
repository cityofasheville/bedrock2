# Bedrock 2
![LOGO](./docs/bedrock.png)

Bedrock is a system for strategic data asset inventory and dependency management, as well as automation of the most common mechanisms for copying or transforming data. Bedrock focuses on two types of data:

 - Data for reporting or performance management
 - Data used for integrating systems

What these two types have in common is a need for a managed interface between the systems or processes that generate the data and those that make use of it. As much as possible, systems that use the data should be able to remain ignorant of the details of how it is extracted or maintained, other than what is captured in metadata to support its use.

Bedrock works in conjunction with the data inventory itself, which is maintained in the [managed-data-assets repository](https://github.com/cityofasheville/managed-data-assets).

Bedrock consists of two parts, a set of command-line scripts and a collection of AWS infrastructure that implements an ETL system.

### Asset Preprocessing

Whenever Assets in the [managed-data-assets repository](https://github.com/cityofasheville/managed-data-assets) are created or modified, a Github Action script copies the data up to an S3 bucket in AWS. Then it runs the [preprocess_assets.py](https://github.com/cityofasheville/managed-data-assets/blob/production/.github/workflows/preprocess_assets/preprocess_assets.py) command to combine information on all assets defined into a single ```all_assets.json``` file that is used by the ETL system running in AWS.


## Command-Line Scripts

Bedrock scripts are located in the ```scripts``` directory and are intended to be called manually from the command line or from a tool like CircleCI. There are currently 2 scripts, which create Blueprints.

### Blueprint Commands

In Bedrock a _blueprint_ is the standard representation of an asset that can be used to create a table in a database or validate data at an API interface. For now we only have two commands available, one to create a new blueprint based on an existing table and one to create a table based on a blueprint file:

 - To create a database table based on a blueprint, use the ```create_table_from_blueprint``` script.
 - To create a blueprint file based on an existing database table, use the ```create_blueprint``` script.

The connection variables used here refer to connections defined in the ```managed-data-assets``` S3 bucket.

## AWS ETL Infrastructure

The AWS portion of Bedrock consists of the ```process_etl_run_group``` step function that runs a all the ETL jobs in a specified run-group in an order that accounts for dependencies between different datasets. The code for this step function and the associated set of lambdas is located in the [./bedrock/aws](./bedrock/aws) directory.

The lambdas are a mix of Python and Node. Within a Lambda directory


## Other Information

### Installation on Docker

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


