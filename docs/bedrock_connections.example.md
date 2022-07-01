#### Connection Files
Secrets Manager holds data in these formats:


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
    
    {
        "type": "google_sheets",
        "client_email": "bedrock@gserviceaccount.com",
        "private_key": "-----BEGIN PRIVATE KEY-----ihflieurbvliasubfv....."
    }
    
    {
        "type": "sftp",
        "host": "hostname.com",
        "port": 22,
        "username": "bedrock",
        "password": "xxxxx",
        "pgp_key": "-----BEGIN PGP PUBLIC KEY BLOCK-iuygqwerfibhu...."
    }