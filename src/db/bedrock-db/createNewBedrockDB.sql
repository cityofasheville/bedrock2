DROP TABLE IF EXISTS bedrock.tasks;
DROP TYPE IF EXISTS bedrock.task_types;
DROP TABLE IF EXISTS bedrock.etl;
DROP TABLE IF EXISTS bedrock.asset_tags;
DROP TABLE IF EXISTS bedrock.tags;
DROP TABLE IF EXISTS bedrock.custom_values;
DROP TABLE IF EXISTS bedrock.asset_type_custom_fields;
DROP TABLE IF EXISTS bedrock.custom_fields;
DROP TABLE IF EXISTS bedrock.dependencies;
DROP TABLE IF EXISTS bedrock.assets;
DROP TABLE IF EXISTS bedrock.run_groups;
DROP TABLE IF EXISTS bedrock.asset_types;
DROP TABLE IF EXISTS bedrock.connections;
DROP TYPE IF EXISTS bedrock.connections_classes;
DROP TABLE IF EXISTS bedrock.owners;
DROP SCHEMA IF EXISTS bedrock;
DROP ROLE IF EXISTS bedrock_user;

CREATE ROLE bedrock_user WITH 
	NOSUPERUSER
	NOCREATEDB
	NOCREATEROLE
	INHERIT
	LOGIN
	NOREPLICATION
	NOBYPASSRLS
	CONNECTION LIMIT -1;

CREATE SCHEMA bedrock;

CREATE TABLE bedrock.owners (
  owner_id text PRIMARY KEY,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  organization text,
  department text,
  division text,
  notes text NULL
);
-- Permissions
ALTER TABLE bedrock.owners OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.owners TO bedrock_user;

CREATE TYPE bedrock.connections_classes AS ENUM ('db', 'api', 'file', 'sheets');

CREATE TABLE bedrock.connections (
  connection_name text NOT NULL,
  description text NULL,
  connection_class bedrock.connections_classes NULL,
  CONSTRAINT connections_pkey PRIMARY KEY (connection_name)
);
-- Permissions
ALTER TABLE bedrock.connections OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.connections TO bedrock_user;

CREATE TABLE bedrock.asset_types (
  id text NOT NULL,
  "name" text NOT NULL,
  parent text NULL
);
-- Permissions
ALTER TABLE bedrock.asset_types OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.asset_types TO bedrock_user;

CREATE TABLE bedrock.run_groups (
	run_group_name text NOT NULL,
	cron_string text NOT NULL,
	CONSTRAINT run_groups_pkey PRIMARY KEY (run_group_name)
);
-- Permissions
ALTER TABLE bedrock.run_groups OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.run_groups TO bedrock_user;

CREATE TABLE bedrock.assets (
	asset_name text NOT NULL,
  display_name text NULL,
	description text NULL,
	"location" jsonb NULL,
  asset_type text NULL,
  owner_id text NULL,
  notes text NULL,
  link text NULL,
	active bool NOT NULL,
	CONSTRAINT assets_pkey PRIMARY KEY (asset_name)
);
-- Permissions
ALTER TABLE bedrock.assets OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.assets TO bedrock_user;

CREATE TABLE bedrock.dependencies (
	asset_name text NOT NULL,
	dependency text NOT NULL,
	CONSTRAINT dependencies_pk PRIMARY KEY (asset_name, dependency)
);
-- Permissions
ALTER TABLE bedrock.dependencies OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.dependencies TO bedrock_user;

CREATE TABLE bedrock.custom_fields (
  id text NOT NULL,
  field_display text NOT NULL, -- display name
  field_type text NOT NULL
);
-- Permissions
ALTER TABLE bedrock.custom_fields OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.custom_fields TO bedrock_user;

CREATE TABLE bedrock.asset_type_custom_fields (
  asset_type_id text NOT NULL,
  custom_field_id text NOT NULL,
  required boolean NOT NULL DEFAULT FALSE
);
-- Permissions
ALTER TABLE bedrock.asset_type_custom_fields OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.asset_type_custom_fields TO bedrock_user;

CREATE TABLE bedrock.custom_values (
  asset_name text NOT NULL,
  field_id text NOT NULL,
  field_value text NULL
);
-- Permissions
ALTER TABLE bedrock.custom_values OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.custom_values TO bedrock_user;

CREATE TABLE bedrock.tags (
	tag_name text NOT NULL,
	display_name text NULL,
	CONSTRAINT tags_pk PRIMARY KEY (tag_name)
);
-- Permissions
ALTER TABLE bedrock.tags OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.tags TO bedrock_user;

CREATE TABLE bedrock.asset_tags (
	asset_name text NOT NULL,
	tag_name text NOT NULL,
	CONSTRAINT asset_tags_pk PRIMARY KEY (asset_name, tag_name)
);
-- Permissions
ALTER TABLE bedrock.asset_tags OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.asset_tags TO bedrock_user;

CREATE TABLE bedrock.etl (
	asset_name text NOT NULL,
	run_group text NOT NULL,
	active bool NOT NULL,
	CONSTRAINT etl_pk PRIMARY KEY (run_group, asset_name)
);
-- Permissions
ALTER TABLE bedrock.etl OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.etl TO bedrock_user;

CREATE TYPE bedrock.task_types AS ENUM (
'aggregate', 
'encrypt', 
'file_copy', 
'run_lambda', 
'sql', 
'table_copy');

CREATE TABLE bedrock.tasks (
	asset_name text NOT NULL,
	seq_number int2 NOT NULL,
	description text NULL,
	"type" bedrock.task_types NOT NULL,
	active bool NOT NULL,
	"source" jsonb NULL,
	target jsonb NULL,
	"configuration" text NULL,
	CONSTRAINT tasks_pk PRIMARY KEY (asset_name, seq_number)
);
-- Permissions
ALTER TABLE bedrock.tasks OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.tasks TO bedrock_user;
