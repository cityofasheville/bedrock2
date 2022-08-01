# Connection Files
Secrets Manager holds data in these formats:

    "postgresql",
    "sqlserver",
    "google_sheets",
    "s3",
    "sftp",
    "fileshare", (not used)
    "mysql", (not used)
    "google_drive", (not used)
    
We name database connections with names like "servername/database/username".
In Secrets Manager we create them as "Other type of secret" and then "Plaintext", which allows you to add key/values as JSON.

## For table_copy and sql
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
## For table_copy    
```
    {
        "type": "google_sheets",
        "client_email": "bedrock@gserviceaccount.com",
        "private_key": "-----BEGIN PRIVATE KEY-----ihflieurbvliasubfv....."
    }
```
## For table_copy and file_copy
```
    {
        "type": "s3",
        "s3_bucket": "bedrock-data-files"
    }
```
## For file_copy and sftp    
```
    {
        "type": "sftp",
        "host": "hostname.com",
        "port": 22,
        "username": "bedrock",
        "password": "xxxxx",
        "pgp_key": "-----BEGIN PGP PUBLIC KEY BLOCK-iuygqwerfibhu...."
    }
```
