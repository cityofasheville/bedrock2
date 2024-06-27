select 'truncate table bedrock.' || table_name::text || ';' from information_schema.tables where table_schema = 'bedrock' and table_type = 'BASE TABLE'

truncate table bedrock.tags;
truncate table bedrock.connections;
truncate table bedrock.custom_fields;
truncate table bedrock.asset_types;
truncate table bedrock.assets;
truncate table bedrock.dependencies;
truncate table bedrock.run_groups;
truncate table bedrock.tasks;
truncate table bedrock.asset_tags;
truncate table bedrock.custom_values;
truncate table bedrock.etl;
truncate table bedrock.asset_type_custom_fields;
truncate table bedrock.owners;