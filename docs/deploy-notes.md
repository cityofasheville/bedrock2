# Deploying a test copy
Included scripts will build a complete copy of Bedrock on AWS, including the asset database, roles, Lambdas, and the Step Function.

You will need AdministratorAccess command line permissions to AWS.

Create a file `make_variables` based on `make_variables.sample`. Change INSTANCE to a unique name for your instance, and set the region and account info.

The variable build_mode can be set to "std" if deploying from Linux or "sam" to use a container. This is needed for two Python Lambdas that need Linux native compilation targets for encryption used by the paramiko package.

To start, cd into ```src/bedrock_common`` and run 

```bash
make init
make apply
```

Then cd into each other directory in ```src``` and run ```make``` commands to create the infrastructure.

```bash
make init
make apply
```
- You can also use ```apply-y``` instead of ```apply``` without having to reply 'yes' to each step.
- When you are done you can run ```make destroy``` in each directory.

### Build everything
```sh
cd src/bedrock_common
make init
make apply
```
If you are using an existing database, set the value of ```BEDROCK_DB_HOST``` in src/make_variables to the host name of that database and skip the next set of commands.
```sh
cd ../db
make init
make apply-y #(Creates database server - takes a while)
make db      #(Creates bedrock database and captures DB endpoint in src/db/make_variables.generated)
make seed    #(Fill database with assets from Github)
# Copy the database host from src/db/make_variables.generated into the value of BEDROCK_DB_HOST
# in src/make_variables (without the port number)
```
Next, create the ETL and API infrastructure.
```sh
cd ../etl
make init
make apply-y
cd ../api
make init
make apply-y
```

### Build one Lambda
```sh
# Make sure you create the role needed first
cd src/etl/bedrock-lambda-role
make init
make apply-y
cd ../etl_task_sql  #(for example)
make init
make apply-y
```

![directory-structure](./deployment-folders.png)
