# etl_task_file_copy: file copy functions

Python works much more reliably for sftp than JavaScript.


## Requirements:

-Python3
-AWS SAM
-Docker
-Terraform

(Uses SAM in a Docker container to build because the Crypto in SSH/file_copy in a Lambda requires a Linux native build.)

## Build and deploy

From etl_task_file_copy dir, run ```make init``` and then ```make apply```

## Build and test locally

Edit ```localtest.json``` with the event you wish to test.
From etl_task_file_copy dir, run ```make local``` and then:

Special note: ftp_path requires a slash at start and end, while path must have only a trailing slash.




