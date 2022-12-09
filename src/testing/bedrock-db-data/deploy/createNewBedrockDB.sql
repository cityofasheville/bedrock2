/*

create database bedrock;
create schema bedrock;
*/

-- drop table bedrock.assets;
create table bedrock.assets (
	asset_name text primary key not null,
	description text null,
	location text null,
	active bool not null
);

-- drop table bedrock.dependencies;
create table bedrock.dependencies (
	asset_name text not null,
	dependency text not null,
	CONSTRAINT dependencies_pk PRIMARY KEY (asset_name, dependency)
);

-- drop table bedrock.etl;
CREATE TABLE bedrock.etl (
	asset_name text NOT NULL,
	run_group text NOT NULL,
	active bool NOT NULL,
	CONSTRAINT etl_pk PRIMARY KEY (run_group, asset_name)
);

-- drop table bedrock.run_groups;
create table bedrock.run_groups (
	run_group_name text primary key not null,
	cron_string text not null
);

-- drop table bedrock.tasks;
create table bedrock.tasks (
	asset_name text not null,
	seq_number smallint not null,
	type text not null,
	active bool not null,
	source json null,
	target json null,
	configuration text null
);


/*
INSERT INTO bedrock.tasks
(asset_name, seq_number, "type", active, "source", target, "configuration")
VALUES('ad_info', 1, 'table_copy', true, '{"connection": "munis/munprod/mssqlgisadmin","schemaname": "amd","tablename": "ad_info"}', 
'{"connection": "pubrecdb1/mdastore1/dbadmin","schemaname": "internal","tablename": "ad_info"}', null);

INSERT INTO bedrock.tasks
(asset_name, seq_number, "type", active, "source", target, "configuration")
VALUES('somesql', 1, 'sql', true, null, 
'{"connection": "pubrecdb1/mdastore1/dbadmin"}', 'select * from tablename');
*/