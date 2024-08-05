# etl_task_file_copy

## Build and deploy
Requirements:

-Python3
-AWS SAM
-Docker *
-Terraform

(* Docker only needed if deploying from non-Linux environment. Uses SAM in a Docker container to build 
because the Crypto in SSH/SFTP in a Lambda requires a Linux native build.
Set build_mode = sam in make_variables)

```
make init
make apply
```

## Usage: Event structure to pass to Lambda

s3_connection and ftp_connection refer to named connections in AWS Secrets Manager.

Special note: "path" for an FTP site requires a slash at start and end, while "path" for s3 must have only a trailing slash.




