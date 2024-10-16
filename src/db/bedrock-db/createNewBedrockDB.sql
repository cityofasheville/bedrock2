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
-- DROP ROLE IF EXISTS ${process.env.BEDROCK_DB_USER};

-- CREATE ROLE ${process.env.BEDROCK_DB_USER} WITH 
-- 	NOSUPERUSER
-- 	NOCREATEDB
-- 	NOCREATEROLE
-- 	INHERIT
-- 	LOGIN
-- 	NOREPLICATION
-- 	NOBYPASSRLS
-- 	CONNECTION LIMIT -1;
 
ALTER USER ${process.env.BEDROCK_DB_USER} WITH PASSWORD '${process.env.BEDROCK_DB_PASSWORD}';   -- <====================== PASSWORD	

CREATE SCHEMA bedrock;
ALTER SCHEMA bedrock OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT USAGE ON SCHEMA bedrock TO ${process.env.BEDROCK_DB_USER};

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
ALTER TABLE bedrock.owners OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.owners TO ${process.env.BEDROCK_DB_USER};

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
ALTER TABLE bedrock.connections OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.connections TO ${process.env.BEDROCK_DB_USER};

---------------------------------------------
CREATE TABLE bedrock.asset_types (
  asset_type_id text PRIMARY KEY,
  asset_type_name text NOT NULL,
  parent text NULL
);
--
ALTER TABLE bedrock.asset_types OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.asset_types TO ${process.env.BEDROCK_DB_USER};

---------------------------------------------
CREATE TABLE bedrock.run_groups (
	run_group_id text PRIMARY KEY,
	run_group_name text NOT NULL,
	cron_string text NOT NULL,
	CONSTRAINT run_groups_name_key UNIQUE (run_group_name)
);
--
ALTER TABLE bedrock.run_groups OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.run_groups TO ${process.env.BEDROCK_DB_USER};

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
ALTER TABLE bedrock.assets OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.assets TO ${process.env.BEDROCK_DB_USER};

---------------------------------------------
CREATE TABLE bedrock.dependencies (
	asset_id text NOT NULL,
	dependent_asset_id text NOT NULL,
	CONSTRAINT dependencies_key UNIQUE (asset_id, dependent_asset_id)
);
--
ALTER TABLE bedrock.dependencies OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.dependencies TO ${process.env.BEDROCK_DB_USER};

---------------------------------------------
CREATE TABLE bedrock.custom_fields (
  custom_field_id text PRIMARY KEY,
  custom_field_name text NOT NULL, -- display name
  field_type text NOT NULL,
  field_data jsonb NULL,
	CONSTRAINT custom_field_name_key UNIQUE (custom_field_name)
);
--
ALTER TABLE bedrock.custom_fields OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.custom_fields TO ${process.env.BEDROCK_DB_USER};

---------------------------------------------
CREATE TABLE bedrock.asset_type_custom_fields (
  asset_type_id text NOT NULL,
  custom_field_id text NOT NULL,
  required boolean NOT NULL DEFAULT FALSE,
	CONSTRAINT asset_type_custom_fields_key UNIQUE (asset_type_id, custom_field_id)
);
--
ALTER TABLE bedrock.asset_type_custom_fields OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.asset_type_custom_fields TO ${process.env.BEDROCK_DB_USER};

---------------------------------------------
CREATE TABLE bedrock.custom_values (
  asset_id text NOT NULL,
  custom_field_id text NOT NULL,
  field_value text NULL,
	CONSTRAINT custom_values_key UNIQUE (asset_id, custom_field_id)
);
--
ALTER TABLE bedrock.custom_values OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.custom_values TO ${process.env.BEDROCK_DB_USER};

---------------------------------------------
CREATE TABLE bedrock.tags (
	tag_id text PRIMARY KEY,
	tag_name text NOT NULL,
	display_name text NULL,
	CONSTRAINT tag_name_key UNIQUE (tag_name)
);
--
ALTER TABLE bedrock.tags OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.tags TO ${process.env.BEDROCK_DB_USER};

---------------------------------------------
CREATE TABLE bedrock.asset_tags (
	asset_id text NOT NULL,
	tag_id text NOT NULL,
	CONSTRAINT asset_tags_pk UNIQUE (asset_id, tag_id)
);
--
ALTER TABLE bedrock.asset_tags OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.asset_tags TO ${process.env.BEDROCK_DB_USER};


---------------------------------------------
CREATE TABLE bedrock.etl (
	asset_id text NOT NULL,
	run_group_id text NOT NULL,
	active bool NOT NULL,
	CONSTRAINT etl_key UNIQUE (asset_id, run_group_id),
	CONSTRAINT etl_unique UNIQUE (asset_id)
);
--
ALTER TABLE bedrock.etl OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.etl TO ${process.env.BEDROCK_DB_USER};

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
ALTER TABLE bedrock.tasks OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE bedrock.tasks TO ${process.env.BEDROCK_DB_USER};



---------------------------
-- VIEWS 
---------------------------
create view bedrock.asset_tag_view as
select at2.asset_id, a.asset_name, 
at2.tag_id, tags.tag_name 
from bedrock.asset_tags at2
inner join bedrock.assets a
on at2.asset_id = a.asset_id 
inner join bedrock.tags
on at2.tag_id = tags.tag_id;

create view bedrock.asset_type_custom_field_view as
select atcf.asset_type_id,  asset_type_name, 
atcf.custom_field_id, custom_field_name, required
from bedrock.asset_types at2 
inner join bedrock.asset_type_custom_fields atcf
on at2.asset_type_id = atcf.asset_type_id
inner join bedrock.custom_fields cf 
on atcf.custom_field_id = cf.custom_field_id; 

create view bedrock.asset_type_view as
select at2.asset_type_id, at2.asset_type_name, 
at2.parent, at3.asset_type_name parent_name
from bedrock.asset_types at2 
left join bedrock.asset_types at3 
on at2.parent = at3.asset_type_id;

create view bedrock.asset_view as
select asset_id, asset_name, description, "location", a.asset_type_id, asset_type_name, owner_id, notes, link, active
FROM bedrock.assets a
left join bedrock.asset_types at2
on a.asset_type_id = at2.asset_type_id;

CREATE VIEW bedrock.dependency_view as
select asset_id, asset_name, dependent_asset_id, dependency, bool_and(implied_dependency) implied_dependency from (
 SELECT dep.asset_id,
    as2.asset_name,
    dep.dependent_asset_id,
    as3.asset_name AS dependency,
    false as implied_dependency
   FROM bedrock.dependencies dep
     JOIN bedrock.assets as2 ON as2.asset_id = dep.asset_id
     JOIN bedrock.assets as3 ON dep.dependent_asset_id = as3.asset_id
UNION
 SELECT a1.asset_id,
    a1.asset_name,
    a2.asset_id AS dependent_asset_id,
    a2.asset_name AS dependency,
    true as implied_dependency
   FROM bedrock.assets a1
     JOIN bedrock.tasks t ON a1.asset_id = t.asset_id
     JOIN bedrock.tags ON (t.source ->> 'aggregate'::text) = tags.tag_name
     JOIN bedrock.asset_tags at2 ON tags.tag_id = at2.tag_id
     JOIN bedrock.assets a2 ON a2.asset_id = at2.asset_id
  WHERE t.type = 'aggregate'::text
UNION
 SELECT a1.asset_id,
    a1.asset_name,
    a2.asset_id AS dependent_asset_id,
    a2.asset_name AS dependency,
    true as implied_dependency
   FROM bedrock.assets a1
     JOIN bedrock.tasks t ON a1.asset_name = (t.target ->> 'asset'::text)
     JOIN bedrock.assets a2 ON a2.asset_name = (t.source ->> 'asset'::text)
  WHERE t.type = ANY (ARRAY['table_copy'::text, 'file_copy'::text])
  order by asset_name 
) inr
group by asset_id, asset_name, dependent_asset_id, dependency;

create view bedrock.etl_view as 
select etl.asset_id, asset_name, etl.run_group_id, run_group_name, etl.active 
from bedrock.etl
inner join bedrock.assets
on etl.asset_id = assets.asset_id 
inner join bedrock.run_groups rg 
on etl.run_group_id = rg.run_group_id; 

create view bedrock.task_view as
SELECT tasks.task_id, tasks.asset_id, asset_name, seq_number, tasks.description, "type", tasks.active, "source", target, "configuration"
FROM bedrock.tasks
inner join bedrock.assets a 
on tasks.asset_id = a.asset_id; 

create view bedrock.custom_value_view as
select cv.asset_id, a.asset_name,
cv.custom_field_id, cf.custom_field_name, cf.field_type, cf.field_data 
from bedrock.custom_values cv
inner join bedrock.assets a
on cv.asset_id = a.asset_id 
inner join bedrock.custom_fields cf 
on cv.custom_field_id = cf.custom_field_id;

GRANT SELECT ON TABLE bedrock.asset_type_custom_field_view TO ${process.env.BEDROCK_DB_USER};
GRANT SELECT ON TABLE bedrock.asset_tag_view TO ${process.env.BEDROCK_DB_USER};
GRANT SELECT ON TABLE bedrock.asset_type_view TO ${process.env.BEDROCK_DB_USER};
GRANT SELECT ON TABLE bedrock.dependency_view TO ${process.env.BEDROCK_DB_USER};
GRANT SELECT ON TABLE bedrock.etl_view TO ${process.env.BEDROCK_DB_USER};
GRANT SELECT ON TABLE bedrock.task_view TO ${process.env.BEDROCK_DB_USER};
GRANT SELECT ON TABLE bedrock.asset_view TO ${process.env.BEDROCK_DB_USER};
GRANT SELECT ON TABLE bedrock.custom_value_view TO ${process.env.BEDROCK_DB_USER};


-- Create testdata schema and tables to test bedrock. 
drop table if exists testdata.fromtable;
drop table if exists testdata.totable;
drop schema if exists testdata;

create schema testdata;
ALTER SCHEMA testdata OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT USAGE ON SCHEMA testdata TO ${process.env.BEDROCK_DB_USER};

create table testdata.fromtable as 
SELECT generate_series(1,100) AS id,
now()::timestamp as date_loaded, md5(random()::text) AS random_data;

ALTER TABLE testdata.fromtable OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE testdata.fromtable TO ${process.env.BEDROCK_DB_USER};

select * into testdata.totable
from testdata.fromtable
where 1=2;

ALTER TABLE testdata.totable OWNER TO ${process.env.BEDROCK_DB_USER};
GRANT ALL ON TABLE testdata.totable TO ${process.env.BEDROCK_DB_USER};