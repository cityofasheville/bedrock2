-- IN Dev, bedrock is the owner of everything.
-- In Prod, dbadmin is the owner, and bedrock_user is used by the app.

ALTER SCHEMA bedrock OWNER TO bedrock;
GRANT USAGE ON SCHEMA bedrock TO bedrock;


--
ALTER TABLE bedrock.owners OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.owners TO bedrock;


);
--
ALTER TABLE bedrock.connections OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.connections TO bedrock;

---------------------------------------------

ALTER TABLE bedrock.asset_types OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.asset_types TO bedrock;

---------------------------------------------

ALTER TABLE bedrock.run_groups OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.run_groups TO bedrock;

--
ALTER TABLE bedrock.assets OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.assets TO bedrock;

---------------------------------------------

--
ALTER TABLE bedrock.dependencies OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.dependencies TO bedrock;

---------------------------------------------

--
ALTER TABLE bedrock.custom_fields OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.custom_fields TO bedrock;

---------------------------------------------

--
ALTER TABLE bedrock.asset_type_custom_fields OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.asset_type_custom_fields TO bedrock;

---------------------------------------------

--
ALTER TABLE bedrock.custom_values OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.custom_values TO bedrock;

---------------------------------------------

ALTER TABLE bedrock.tags OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.tags TO bedrock;

---------------------------------------------

--
ALTER TABLE bedrock.asset_tags OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.asset_tags TO bedrock;



--
ALTER TABLE bedrock.etl OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.etl TO bedrock;

---------------------------------------------

--
ALTER TABLE bedrock.tasks OWNER TO bedrock;
GRANT ALL ON TABLE bedrock.tasks TO bedrock;


GRANT SELECT ON TABLE bedrock.asset_type_custom_field_view TO bedrock;
GRANT SELECT ON TABLE bedrock.asset_tag_view TO bedrock;
GRANT SELECT ON TABLE bedrock.asset_type_view TO bedrock;
GRANT SELECT ON TABLE bedrock.dependency_view TO bedrock;
GRANT SELECT ON TABLE bedrock.etl_view TO bedrock;
GRANT SELECT ON TABLE bedrock.task_view TO bedrock;
