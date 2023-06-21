# etl_task_file_copy

Python works much more reliably for SFTP than JavaScript.



## Build and deploy
Requirements:

-Python3
-AWS SAM
-Docker
-Terraform

(Uses SAM in a Docker container to build because the Crypto in SSH/SFTP in a Lambda requires a Linux native build.)

```
terraform init
terraform apply -var-file=ca.tfvars
```
Run ```builddeploy.sh``` to deploy Lambda. (Run ```terraform init``` in deploy/ first)
Run ```runsambuild.sh``` to test locally.


## Usage: Event structure to pass to Lambda

s3_connection and ftp_connection refer to named connections in AWS Secrets Manager.

Special note: ftp_path requires a slash at start and end, while path must have only a trailing slash.




