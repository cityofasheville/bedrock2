# Deploying Bedrock
Included scripts will build a complete copy of Bedrock on AWS, including the asset database, roles, Lambdas, and the Step Function.

You will need AdministratorAccess command line permissions to AWS.

Create a file `make_variables` based on `make_variables.sample`. Change INSTANCE to a unique name for your instance, and set the region and account info.

The variable build_mode can be set to "std" if deploying from Linux or "sam" to use a container. This is needed for two Python Lambdas that need Linux native compilation targets for encryption used by the paramiko package.

In the instructions below, you may use use ```apply-y``` instead of ```apply``` to avoid having to reply 'yes' to each step.

To destroy AWS infrastructure that has been built, run ```make init``` and then ```make destroy``` in each directory in the opposite order that you built them.

## Building the Infrastructure
Whether you are building the entire Bedrock infrastructure, you will need to begin by building ```bedrock_common```, which is used by most components of the system.

```sh
cd src/bedrock_common
make init
make apply
```
### Database
If you are using an existing database, set the value of ```BEDROCK_DB_HOST``` in src/make_variables to the host name of that database and skip the next set of commands. Otherwise run the following:
```sh
cd ../db
make init
make apply-y #(Creates database server - takes a while)
make db      #(Creates bedrock database and captures DB endpoint in src/db/make_variables.generated)
make seed    #(Fill database with assets from Github)
# Copy the database host from src/db/make_variables.generated into the value of BEDROCK_DB_HOST
# in src/make_variables (without the port number)

### Building the ETL and/or API infrastructure
The ETL and API infrastructure are independent of one another. You may build only one and the order is unimportant.

```sh
cd ../etl
make init
make apply-y
cd ../api
make init
make apply-y
```

### Build one Lambda
If you need to build just a single Lambda, first make sure you have created the Lambda role:
```sh
# Make sure you create the role needed first
cd src/etl/bedrock-lambda-role
make init
make apply-y
```
Then navigate to the directory of the Lambda you wish to build and run:
```
make init
make apply-y
```

![directory-structure](./deployment-folders.png)
