# Database credentials

A number of routines access the Bedrock database: create-etl-run-map, bedrock-api-backend, bedrock-db, load_assets, and load_files. These all use the code in bedrock_common to determine the database credentials.

If you are creating a new database using the scripts in src/db, a file src/db/make_variables.generated will be created with the variable ```BEDROCK_DB_HOST_ENDPOINT=""``` with the name of the server you created. (see Note 1)

In addition the following variables can be set in the file src/make_variables:

- ```BEDROCK_DB_HOST=""```
- ```BEDROCK_DB_USER=""```
- ```BEDROCK_DB_PASSWORD=""```
- ```BEDROCK_DB_NAME=""```

### The rules are:

If BEDROCK_DB_HOST is set, that will be used for the hostname. If not, BEDROCK_DB_HOST_ENDPOINT will be used. 

To connect to the production server, don't set either one. It will use the credentials found in AWS Secrets Manager with the key "pubrecdb1/bedrock/bedrock_user".

Notice that the routine bedrock-db does not use the host variables, it creates a server and returns its name. It can however use the user, password, and db variables.

User, password, and db can be set for all routines. If they are not set, the default values are used (for production the values from Secrets Manager are used.)

Defaults:
- User: bedrock
- Password: test-bedrock
- Database: bedrock




### Notes

- Note 1: BEDROCK_DB_HOST_ENDPOINT includes the port number, but if you copy it to src/make_variables remove the ":5432"
- Note 2: Port and schema are not variables and are always 5432 and 'bedrock' respectively.