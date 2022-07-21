# etl_task_file_copy: file copy functions

Python works much more reliably for sftp than JavaScript.

## Build and deploy
Requirements:

-Python3
-AWS SAM
-Docker
-Terraform

(Uses SAM in a Docker container to build because the Crypto in SSH/file_copy in a Lambda requires a Linux native build.)

To deploy role: cd to deploy/etl_task_file_copy-role and run: 
```
terraform init
terraform apply -var-file=ca.tfvars
```
Run ```builddeploy.sh``` to deploy Lambda. (Run ```terraform init``` in deploy/etl_task_file_copy first)
Run ```runsambuild.sh``` to test locally.


Special note: ftp_path requires a slash at start and end, while s3_path must have only a trailing slash.




