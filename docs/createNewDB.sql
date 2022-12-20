/*
create database bedrock;
create schema bedrock;
*/

create table bedrock.assets (
	asset_name text primary key not null,
	location text null,
	active bool not null
);

create table bedrock.dependencies (
	asset_name text not null,
	dependency text not null,
	CONSTRAINT dependencies_pk PRIMARY KEY (asset_name, dependency)
);

CREATE TABLE bedrock.etl (
	asset_name text NOT NULL,
	run_group text NOT NULL,
	active bool NOT NULL,
	CONSTRAINT etl_pk PRIMARY KEY (run_group, asset_name)
);

create table bedrock.run_group (
	run_group_name text primary key not null,
	cron_string text not null
);

-- drop table bedrock.task;
CREATE TABLE bedrock.tasks (
	asset_name text NOT NULL,
	seq_number int2 NOT NULL,
	description text NULL,
	"type" text NOT NULL,
	active bool NOT NULL,
	"source" json NULL,
	target json NULL,
	"configuration" text NULL,
	CONSTRAINT tasks_pk PRIMARY KEY (asset_name, seq_number)
);
