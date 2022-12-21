# etl_task_sftp SFTP functions

Python works much more reliably for SFTP than JavaScript.

## etl_task_sftp API
There are 4 base actions: 'put', 'get', 'list', and 'del'. Get and put transfer a file from an S3 bucket.
A 5th action type 'getall' downloads all files from an FTP dir to S3 **and deletes them** from ftp.
See the data structures to pass [below](#data-structures).

## Build and deploy
Requirements:

-Python3
-AWS SAM
-Docker
-Terraform

(Uses SAM in a Docker container to build because the Crypto in SSH/SFTP in a Lambda requires a Linux native build.)

To deploy role: cd to deploy/etl_task_sftp-role and run: 
```
terraform init
terraform apply -var-file=ca.tfvars
```
Run ```builddeploy.sh``` to deploy Lambda. (Run ```terraform init``` in deploy/etl_task_sftp first)
Run ```runsambuild.sh``` to test locally.


## Usage: Event structure to pass to Lambda

s3_connection and ftp_connection refer to named connections in AWS Secrets Manager.

Special note: ftp_path requires a slash at start and end, while s3_path must have only a trailing slash.

#### Data Structures
Call Lambda with one of these data structures passed in as the event:
{
    "action": "put",
    "s3_connection": "",
    "s3_path": "", 
    "ftp_connection": "",
    "ftp_path": "/",
    "filename": ""
}

{
    "action": "get",
    "s3_connection": "",
    "s3_path": "", 
    "ftp_connection": "",
    "ftp_path": "/",
    "filename": "", 
}

{
    "action": "list",
    "ftp_connection": "",
    "ftp_path": "/"
}

{
    "action": "del",
    "ftp_connection": "",
    "ftp_path": "/",
    "filename": ""
}

{
    "action": "getall",
    "s3_connection": "",
    "s3_path": "", 
    "ftp_connection": "",
    "ftp_path": "/"
}


