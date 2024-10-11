## Local Development
The Lambdas can be be run locally, which allows for faster development cycles.
All of the ETL scripts under /src/etl/* can be run by running the command ```make local``` in the directory for the lambda. 
There is generally an event variable in the local.js file, and the Lambda will run once and return a value.
The API script, on the other hand, starts up a local API server. Running ``make local``` in the directory /src/api. Then the api can be called at http://localhost:8000/*, such as http://localhost:8000/assets.



### Database setup for local dev.
Create the file src/make_variables based on src/make_variables.sample.
Database setup uses these variables:

    BEDROCK_DB_HOST="localhost"
    BEDROCK_DB_USER="bedrock_user"
    BEDROCK_DB_PASSWORD="hunter1"
    BEDROCK_DB_NAME="bedrock"

If the host name is left empty, the program will look up the production database in AWS Secrets Manager, and you will need AWS credentials for the program to connect to that.

If you have a bastion ssh tunnel to the server set up, use the hostname localhost.