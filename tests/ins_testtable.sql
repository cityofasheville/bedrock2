insert into testtable(a,b,c,d) values (random(),array_to_string(
    ARRAY (
    SELECT substring(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' 
    FROM (random() *36)::int FOR 1)
    FROM generate_series(1, 12) ), '' ) ,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)