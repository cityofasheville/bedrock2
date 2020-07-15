# To run a simple table_copy test:

Prerequisites: Node and Docker

## Create three Docker db's: SS1, PG1, and PG2. (Two Postgres and one SQL Server. PG2 is on port 5430.) They all have the table "testtable". SS has rows of data. Note: The SS takes a few minutes to create after script runs.

`
tests/setup_docker/setup.sh
`

## Run two copy tasks: SS1 to PG1 and PG1 to PG2.

`
npm install
node tests/table_copy.test.js
`
At this point the data should be in all three databases.

## Remove Docker containers

`
tests/setup_docker/breakdown.sh
`