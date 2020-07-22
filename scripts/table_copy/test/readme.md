# To run a simple table_copy test:

Prerequisites: Node and Docker

    cd tests/setup_docker
    ./setup.sh

Creates three Docker db's: SS1, PG1, and PG2. (Two Postgres and one SQL Server. PG2 is on port 5430.) They all have the table "testtable". SS has rows of data. Note: The SS takes a few minutes to create after script runs.

    cd ../../scripts/table_copy
    npm install
    cd tests
    node table_copy.test.js

Runs two copy tasks: SS1 to PG1 and PG1 to PG2.

At this point the data should be in all three databases.

    tests/setup_docker/breakdown.sh

Removes Docker containers.
