# Creating Connections
A connection is the set of information needed to connect to a data source. For example a database connection might need server name, user name, and password.
There are two steps to creating a new connection: adding to the connections table and adding in Secrets Manager.
# Add to connections table
Add a row to the "bedrock.connections" table in the bedrock database, with these fields:
- connection_id: Random alphanumeric code.
- connection_name: As it will appear in the application.
- secret_name: This is the name of the secret stored in Secrets Manager.
- connection_class: This determines what fields are needed in the asset. It can be one of:
  - db (used for postgresql and sqlserver connections )
  - file (used for s3, sftp and Windows shares)
  - sheets (Google sheets)
  - api (used when calling an external Lambda to read or write from an API)

# Add in AWS Secrets Manager

### Connection Files
Secrets Manager holds data in a json structure. Each of these formats will have a field "type" which can be one of:

    "postgresql"
    "sqlserver"
    "google_sheets"
    "s3"
    "sftp"
    "win"
    "mysql" (not implemented)
    "google_drive" (not implemented)
    
We name database connections with names like "servername/database/username".
In Secrets Manager we create them as "Other type of secret" and then "Plaintext", which allows you to add key/values as JSON.

### Databases
### (table_copy and sql)
```
    {
        "type": "postgresql",
        "host": "postgres-database-hostname",
        "port": 5432,
        "username": "bedrock",
        "password": "xxxxx",
        "database": "mdastore1",
        "description": "Servername"
    }
    
    {
        "type": "sqlserver",
        "host": "sqlserver-database-hostname",
        "port": 1433,
        "database": "database-name",
        "domain": "ASHEVILLE",
        "username": "bedrock",
        "password": "xxxxx",
        "description": "Servername:  AD Authentication"
    }
```
### Google Sheets
### (table_copy)
```
    {
        "type": "google_sheets",
        "client_email": "bedrock@gserviceaccount.com",
        "private_key": "-----BEGIN PRIVATE KEY-----ihflieurbvliasubfv....."
    }
```
### S3
### (table_copy and file_copy) 
- S3 table_copy files are csv by default or fixed width, created in SQL and optionally given the "fixedwidth_noquotes".
```
    {
        "type": "s3",
        "s3_bucket": "bedrock-data-files"
    }
```
### SFTP
### (file_copy and sftp and encrypt)
- Use either password or private_key to connect
- pgp_key is used for encrypting file before sending
- Optional: disabled_algorithms might be needed in unusual circumstances (see paramiko docs)
```
    {
        "type": "sftp",
        "host": "hostname.com",
        "port": 22,
        "username": "bedrock",
        "password": "xxxxx",
        "private_key": "-----BEGIN RSA PRIVATE KEY-----\nasdfgy",
        "pgp_key": "-----BEGIN PGP PUBLIC KEY BLOCK-iuygqwerfibhu....",
        "disabled_algorithms": {
            "pubkeys": [
                "rsa-sha2-512",
                "rsa-sha2-256"
            ]
        },
    }
```
### Windows File Shares
### (file_copy)
```
    {
        "type": "win",
        "domain":"ASHEVILLE",
        "system_name":"10.0.0.1",
        "share_name":"FileShareName",
        "username": "bedrock",
        "password": "xxxxx",
    }
```

### Encryption
### (encrypt)
```
    {
        "type": "encrypt",
        "pgp_key": "-----BEGIN PGP PUBLIC KEY BLOCK-iuygqwerfibhu...."
    }
```

