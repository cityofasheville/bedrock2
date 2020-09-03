# how to run local test

export AWS_PROFILE=custom-terraform
export region=us-east-1
cd .../bedrock2/tests/setup_docker/setup.sh
cd .../bedrock2/bedrock/aws/lambda_functions/etl_task_sql/test/runsam.sh


get_sql_from_file:

    try {
        console.log("local SQL file")
        return `insert into public.testtable(a,b,c,d) 
        select a,b,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
        from public.testtable`
    }
    catch(err) {
        throw ["S3 SQL file error",err]
    }

get_db_defs:

    test_connections_docker.json    


Some SQL files to try:

    insert into public.testtable(a,b,c,d) values (random(),array_to_string(
    ARRAY (
    SELECT substring(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' 
    FROM (random() *36)::int FOR 1)
    FROM generate_series(1, 12) ), '' ) ,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

    insert into public.testtable(a,b,c,d) 
    select a,b,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
    from public.testtable;    