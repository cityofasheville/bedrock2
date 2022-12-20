# Deploying a test copy
Included scripts will build a complete copy of Bedrock on AWS, including the asset database, roles, Lambdas, and the Step Function.

You will need AdministratorAccess command line permissions to AWS.

Create a file `make_variables` based on `make_variables.prod`. Change INSTANCE to a unique name for your instance, and set the region and account info.

Then cd into each directory and run ```make``` commands to create the infrastructure.

```
make init
make plan
make apply
```
(When you are done you can run ```make destroy``` in each.)

### Build in correct order
First create the asset database, in ```src/db/bedrock_db.```  Asset data can be loaded using ```src/db/bedrock_db_data.```
The create the program in this order.
```
src/lambda/roles
src/lambda
src/stepfunctions/roles
src/stepfunctions
src/events/roles
src/events
```
![directory-structure](./docs/deployment-folders.png)
