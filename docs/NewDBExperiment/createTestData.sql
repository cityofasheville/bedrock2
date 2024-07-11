
-- Create testdata schema and tables to test Bedrock. 
drop table if exists testdata.testtable;
drop schema if exists testdata;

create schema testdata;
ALTER SCHEMA testdata OWNER TO bedrock_user;
GRANT USAGE ON SCHEMA testdata TO bedrock_user;

create table testdata.fromtable as 
SELECT generate_series(1,100) AS id,
now()::timestamp as date_loaded, md5(random()::text) AS random_data;

ALTER TABLE testdata.fromtable OWNER TO bedrock_user;
GRANT ALL ON TABLE testdata.fromtable TO bedrock_user;

select * into testdata.totable
from testdata.fromtable
where 1=2;

ALTER TABLE testdata.totable OWNER TO bedrock_user;
GRANT ALL ON TABLE testdata.totable TO bedrock_user;