DROP TABLE IF EXISTS bedrock.tasks cascade;
DROP TYPE IF EXISTS bedrock.task_types;
DROP TABLE IF EXISTS bedrock.etl cascade;
DROP TABLE IF EXISTS bedrock.asset_tags cascade;
DROP TABLE IF EXISTS bedrock.tags cascade;
DROP TABLE IF EXISTS bedrock.custom_values cascade;
DROP TABLE IF EXISTS bedrock.asset_type_custom_fields cascade;
DROP TABLE IF EXISTS bedrock.custom_fields cascade;
DROP TABLE IF EXISTS bedrock.dependencies cascade;
DROP TABLE IF EXISTS bedrock.assets cascade;
DROP TABLE IF EXISTS bedrock.run_groups cascade;
DROP TABLE IF EXISTS bedrock.asset_types cascade;
DROP TABLE IF EXISTS bedrock.connections cascade;
DROP TYPE IF EXISTS bedrock.connections_classes;
DROP TABLE IF EXISTS bedrock.owners;
DROP SCHEMA IF EXISTS bedrock;

-- DROP ROLE IF EXISTS bedrock_user;
-- CREATE ROLE bedrock_user WITH 
-- 	NOSUPERUSER
-- 	NOCREATEDB
-- 	NOCREATEROLE
-- 	INHERIT
-- 	LOGIN
-- 	NOREPLICATION
-- 	NOBYPASSRLS
-- 	CONNECTION LIMIT -1;

-- ALTER USER bedrock_user WITH PASSWORD 'test-bedrock';   -- <====================== PASSWORD	

CREATE SCHEMA bedrock;
ALTER SCHEMA bedrock OWNER TO bedrock_user;
GRANT USAGE ON SCHEMA bedrock TO bedrock_user;

CREATE TABLE bedrock.owners (
  owner_id text PRIMARY KEY,
  owner_name text NOT NULL,
  owner_email text NOT NULL,
  owner_phone text,
  organization text,
  department text,
  division text,
  notes text NULL
);
--
ALTER TABLE bedrock.owners OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.owners TO bedrock_user;

---------------------------------------------
-- CREATE TYPE bedrock.connections_classes AS ENUM ('db', 'api', 'file', 'sheets');

---------------------------------------------
CREATE TABLE bedrock.connections (
	connection_id text PRIMARY KEY,
  connection_name text NOT NULL,
  secret_name text NOT NULL,
  connection_class text NULL,  -- After updates, we may want to change this back to TYPE bedrock.connections_classes
  CONSTRAINT connection_name_key UNIQUE (connection_name)
);
--
ALTER TABLE bedrock.connections OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.connections TO bedrock_user;

---------------------------------------------
CREATE TABLE bedrock.asset_types (
  asset_type_id text PRIMARY KEY,
  asset_type_name text NOT NULL,
  parent text NULL
);
--
ALTER TABLE bedrock.asset_types OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.asset_types TO bedrock_user;

---------------------------------------------
CREATE TABLE bedrock.run_groups (
	run_group_id text PRIMARY KEY,
	run_group_name text NOT NULL,
	cron_string text NOT NULL,
	CONSTRAINT run_groups_name_key UNIQUE (run_group_name)
);
--
ALTER TABLE bedrock.run_groups OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.run_groups TO bedrock_user;

---------------------------------------------
CREATE TABLE bedrock.assets (
	asset_id text PRIMARY KEY,
	asset_name text NOT NULL,
	description text NULL,
	"location" jsonb NULL,
  asset_type_id text NULL,
  owner_id text NULL,
  notes text NULL,
  link text NULL,
	active bool NOT NULL,
	CONSTRAINT asset_name_key UNIQUE (asset_name)
);
--
ALTER TABLE bedrock.assets OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.assets TO bedrock_user;

---------------------------------------------
CREATE TABLE bedrock.dependencies (
	asset_id text NOT NULL,
	dependent_asset_id text NOT NULL,
	CONSTRAINT dependencies_key UNIQUE (asset_id, dependent_asset_id)
);
--
ALTER TABLE bedrock.dependencies OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.dependencies TO bedrock_user;

---------------------------------------------
CREATE TABLE bedrock.custom_fields (
  custom_field_id text PRIMARY KEY,
  custom_field_name text NOT NULL, -- display name
  field_type text NOT NULL,
  field_data jsonb NULL,
	CONSTRAINT custom_field_name_key UNIQUE (custom_field_name)
);
--
ALTER TABLE bedrock.custom_fields OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.custom_fields TO bedrock_user;

---------------------------------------------
CREATE TABLE bedrock.asset_type_custom_fields (
  asset_type_id text NOT NULL,
  custom_field_id text NOT NULL,
  required boolean NOT NULL DEFAULT FALSE,
	CONSTRAINT asset_type_custom_fields_key UNIQUE (asset_type_id, custom_field_id)
);
--
ALTER TABLE bedrock.asset_type_custom_fields OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.asset_type_custom_fields TO bedrock_user;

---------------------------------------------
CREATE TABLE bedrock.custom_values (
  asset_id text NOT NULL,
  custom_field_id text NOT NULL,
  field_value text NULL,
	CONSTRAINT custom_values_key UNIQUE (asset_id, custom_field_id)
);
--
ALTER TABLE bedrock.custom_values OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.custom_values TO bedrock_user;

---------------------------------------------
CREATE TABLE bedrock.tags (
	tag_id text PRIMARY KEY,
	tag_name text NOT NULL,
	display_name text NULL,
	CONSTRAINT tag_name_key UNIQUE (tag_name)
);
--
ALTER TABLE bedrock.tags OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.tags TO bedrock_user;

---------------------------------------------
CREATE TABLE bedrock.asset_tags (
	asset_id text NOT NULL,
	tag_id text NOT NULL,
	CONSTRAINT asset_tags_pk UNIQUE (asset_id, tag_id)
);
--
ALTER TABLE bedrock.asset_tags OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.asset_tags TO bedrock_user;


---------------------------------------------
CREATE TABLE bedrock.etl (
	asset_id text NOT NULL,
	run_group_id text NOT NULL,
	active bool NOT NULL,
	CONSTRAINT etl_key UNIQUE (asset_id, run_group_id)
);
--
ALTER TABLE bedrock.etl OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.etl TO bedrock_user;

---------------------------------------------
-- CREATE TYPE bedrock.task_types AS ENUM (
-- 'aggregate', 
-- 'encrypt', 
-- 'file_copy', 
-- 'run_lambda', 
-- 'sql', 
-- 'table_copy');


---------------------------------------------
CREATE TABLE bedrock.tasks (
	task_id text PRIMARY KEY,
	asset_id text NOT NULL,
	seq_number int2 NOT NULL,
	description text NULL,
	"type" text NOT NULL, -- After updates, we may want to change this back to TYPE bedrock.task_types
	active bool NOT NULL,
	"source" jsonb NULL,
	target jsonb NULL,
	"configuration" text NULL,
	CONSTRAINT tasks_key UNIQUE (asset_id, seq_number)
);
--
ALTER TABLE bedrock.tasks OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.tasks TO bedrock_user;



