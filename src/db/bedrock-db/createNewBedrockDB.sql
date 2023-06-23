-- DROP ROLE bedrock_user;
CREATE ROLE bedrock_user WITH 
	NOSUPERUSER
	NOCREATEDB
	NOCREATEROLE
	INHERIT
	LOGIN
	NOREPLICATION
	NOBYPASSRLS
	CONNECTION LIMIT -1;

-- DROP TABLE bedrock.asset_tags;
CREATE TABLE bedrock.asset_tags (
	asset_name text NOT NULL,
	tag_name text NOT NULL,
	CONSTRAINT asset_tags_pk PRIMARY KEY (asset_name, tag_name)
);

-- Permissions
ALTER TABLE bedrock.asset_tags OWNER TO dbadmin;
GRANT ALL ON TABLE bedrock.asset_tags TO dbadmin;
GRANT ALL ON TABLE bedrock.asset_tags TO bedrock_user;


-- DROP TABLE bedrock.assets;
CREATE TABLE bedrock.assets (
	asset_name text NOT NULL,
	description text NULL,
	"location" json NULL,
	active bool NOT NULL,
	CONSTRAINT assets_pkey PRIMARY KEY (asset_name)
);

-- Permissions
ALTER TABLE bedrock.assets OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.assets TO bedrock_user;


-- DROP TABLE bedrock.dependencies;
CREATE TABLE bedrock.dependencies (
	asset_name text NOT NULL,
	dependency text NOT NULL,
	CONSTRAINT dependencies_pk PRIMARY KEY (asset_name, dependency)
);

-- Permissions
ALTER TABLE bedrock.dependencies OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.dependencies TO bedrock_user;


-- DROP TABLE bedrock.etl;
CREATE TABLE bedrock.etl (
	asset_name text NOT NULL,
	run_group text NOT NULL,
	active bool NOT NULL,
	CONSTRAINT etl_pk PRIMARY KEY (run_group, asset_name)
);

-- Permissions
ALTER TABLE bedrock.etl OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.etl TO bedrock_user;


-- DROP TABLE bedrock.run_groups;
CREATE TABLE bedrock.run_groups (
	run_group_name text NOT NULL,
	cron_string text NOT NULL,
	CONSTRAINT run_groups_pkey PRIMARY KEY (run_group_name)
);

-- Permissions
ALTER TABLE bedrock.run_groups OWNER TO bedrock_user;
GRANT ALL ON TABLE bedrock.run_groups TO bedrock_user;


-- DROP TABLE bedrock.tags;
CREATE TABLE bedrock.tags (
	tag_name text NOT NULL,
	display_name text NULL,
	CONSTRAINT tags_pk PRIMARY KEY (tag_name)
);

-- Permissions
ALTER TABLE bedrock.tags OWNER TO dbadmin;
GRANT ALL ON TABLE bedrock.tags TO dbadmin;
GRANT ALL ON TABLE bedrock.tags TO bedrock_user;


-- DROP TABLE bedrock.tasks;
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

-- Permissions
ALTER TABLE bedrock.tasks OWNER TO dbadmin;
GRANT ALL ON TABLE bedrock.tasks TO dbadmin;
GRANT ALL ON TABLE bedrock.tasks TO bedrock_user;