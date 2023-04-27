/*
create database bedrock;
create schema bedrock;
*/

drop table bedrock.assets;
CREATE TABLE bedrock.assets (
	asset_name text NOT NULL,
	description text NULL,
	"location" json NULL,
	active bool NOT NULL,
	CONSTRAINT assets_pkey PRIMARY KEY (asset_name)
);

drop table bedrock.dependencies;
create table bedrock.dependencies (
	asset_name text not null,
	dependency text not null,
	CONSTRAINT dependencies_pk PRIMARY KEY (asset_name, dependency)
);

drop table bedrock.etl;
CREATE TABLE bedrock.etl (
	asset_name text NOT NULL,
	run_group text NOT NULL,
	active bool NOT NULL,
	CONSTRAINT etl_pk PRIMARY KEY (run_group, asset_name)
);

drop table bedrock.run_groups;
CREATE TABLE bedrock.run_groups (
	run_group_name text NOT NULL,
	cron_string text NOT NULL,
	CONSTRAINT run_groups_pkey PRIMARY KEY (run_group_name)
);

drop table bedrock.tasks;
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
