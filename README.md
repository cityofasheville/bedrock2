# Bedrock 2
![LOGO](./docs/bedrock.png)

Bedrock is a data management system that makes data visible, usable, and high-quality. It allows staff and community to discover relevant data and makes data available through systems like SimpliCity, the City website, or Google Sheets. Bedrock also helps City staff avoid inadvertently breaking systems when making changes by preventing cascading system failures. Future functionality will prevent both system damage and inadvertent releases of sensitive information by identifying potential impacts using Bedrock’s dependency system.

## Deployment
To deploy Bedrock, follow the instructions [here](./docs/deploy-notes.md).

## A Deeper Dive

Bedrock is a system that consists of multiple layers of functionality.

The foundation layer of Bedrock is an inventory of important data assets together with metadata on each, including who owns it, what other data it depends on, how it is created or maintained, and whether it contains sensitive information. Optionally it also contains information about how to create or update the asset via a data copy and/or transformation. 

The layer above the inventory is comprised of two applications: an ETL (extract-transform-load, or data movement & transformation) system for creating or updating assets and an API (application programming interface) that can be used by applications to use the data in the inventory.

Once the API is complete, a third application layer consisting of specialized frontends is planned for development.

### Bedrock ETL (in production)
The Bedrock ETL system allows groups of ETL jobs to be run on a schedule, with the internal ordering of jobs within a group (such as the daily overnight run)  determined automatically based on dependency information for the assets involved. At the end of a run, a summary report of job successes or failures is emailed to administrators. Transfers are transactional (so a failed job will not leave the data in an inconsistent state) and, because Bedrock has dependency information, the failure of a transfer will cause all dependent jobs to be “pruned” so that errors are not propagated. 

The system is currently used to manage over 70 data transfer jobs involving databases, FTP sites, and Google Sheets. In the near term it will also become a key tool for managing data for the NC Benchmarking project which we have rejoined at the City Manager's direction.

As an ETL tool, Bedrock has some overlap with FME, which is used extensively by the GIS team. FME is a powerful ETL tool with extensive GIS capabilities as well as a wide range of possible data sources and targets. The Bedrock ETL system is specifically designed to be simple. It does basic table-to-table (databases and Google Sheets) and file-to-file (S3 or FTP) transfers, as well as running SQL queries. In the near future it will add REST API endpoints and the ability to run an arbitrary function implemented as an AWS Lambda. Its primary advantage is the use of inventory metadata to drive scheduling and prevent error propagation.

### Bedrock API  (in active development)

The Bedrock API is a REST API that allows a client to query, modify and create information about data assets in the inventory, following this design. This is a critical component to enable building frontend applications.

### Bedrock Frontends (future development)
A citywide frontend is planned that will allow staff to search for relevant datasets along with links or contacts to access the data. We will explore the possibility of building in simple data exploration and visualization tools. This frontend will be available on One Asheville.

In addition, an administrative front end is planned that will allow staff involved in data management to create and update data assets in the inventory. This frontend will also be made available through One Asheville. Once ready, the managed data assets Github repository will be retired.

We also plan to use Bedrock for change management either by integrating data dependency information into a configuration management database system (CMDB) or by extending Bedrock itself to capture dependency information on IT infrastructure as well as data. The API has already been designed to support this use case.

## Technical Implementation
The inventory information is stored in a database on AWS, with a mirror maintained in Github as JSON files (to be deprecated when a front end is available for creating and editing asset information).

The ETL system is implemented in AWS as a scheduler, a state machine (AWS Stepfunction) that actually runs a group of jobs, and a set of AWS Lambda functions that are called by the state machine to perform the data movements themselves.

The Bedrock API is implemented using the AWS API Gateway acting as a proxy for a single Lambda that implements all API calls.

The frontend applications will be implemented in React and presented for staff use through One Asheville, with available capabilities defined by staff role as encoded in AD or Google groups.

## Other Information

### Installation on Docker

Bedrock will work on most Linux architectures, but we have standardized on Amazon Linux 2, which can be run as a Docker container defined by [Dockerfile.bedrock](./Dockerfile.bedrock). This will install Python, Node, PostgreSQL and AWS tools, as well as clone this repository.

To build, run and log in on Windows (changing the tag and local directory appropriately):
```
    docker build -f Dockerfile.bedrock --tag ejaxonavl/bedrock .
    winpty docker run -it -v "C:\Users\ericjackson\dev\bedrock\bedrock2":/home/bedrock ejaxonavl/bedrock bash
```

This command maps ```/home/bedrock``` to the specified directory on your local machine so that you can edit the files on your local machine while running Bedrock in the Docker container.

To build Bedrock after logging into the Docker container for the first time, run the following commands (note that a Conda Python environment called  _bedrock_ is automatically activated on login):

    cd /home/bedrock/scripts
    pip install -r requirements.txt
    export BEDROCK_BUCKETNAME=managed-data-assets

Next set up the AWS environment by running the following commands:

```
    export AWS_ACCESS_KEY_ID="_<Access_Key_ID>_"
    export AWS_SECRET_ACCESS_KEY="_<Secred_Access_Key>_"
    export AWS_SESSION_TOKEN="_<Session Token>_"
```

Alternatively, you may set up a profile in the AWS credentials file (see documentation [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-profiles)).


