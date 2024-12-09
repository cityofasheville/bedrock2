# Compilation Prerequisites

## Overview 

When you create a Lambda you can choose either x86_64 or arm64. Both Python and Node are interpreted from source code (or bytecode) so usually either will work.
But Python can call out to C and Rust binary code. If your Python code uses these, it must not only match the architecture, it also must have the same exe format, so Mac ARM (Mach-O) won't work as a Linux based (ELF) Lambda.

We have one Layer that does that: package_py. This called by two Lambdas: etl_task_file_copy and etl_task_sftp.
Deploying these from our Macs takes a little more work. We have two solutions, both using Docker.

## Deploying from Mac M-series

All Lambdas and Layers can be built using one of these two combinations:

* Option 1, deploy locally
  + In make_variables, set build_mode="sam" and architecture="x86_64"
  + Prerequisites:
    - Nodejs 20.x
    - Python 3.12
    - Terraform
    - Docker
    - AWS SAM
    - git, make and zip

* Option 2, using a Docker image
  + In make_variables, set build_mode="std" and architecture="arm64"
  + Prerequisites:
    - Docker
    
  + To install on Docker, see [here](./docker-install.md).

## Deploying from Linux (and presumably Windows WSL)

  + In make_variables, set build_mode="std" and architecture to the architecture of your computer.
  + Prerequisites:
    - Nodejs 20.x
    - Python 3.12
    - Terraform
    - git, make and zip

Docker should work anywhere by setting 'architecture=' to the architecture of your computer.

## Combinations of build_mode and architecture

With the exception of package_py, using build_mode="std" with either architecture ("x86_64" or "arm64") will work inside or out of Docker, for all other Lambdas and Layers.

