select 'truncate table bedrock2.' || table_name::text || ';' from information_schema.tables where table_schema = 'bedrock2' and table_type = 'BASE TABLE'

truncate table bedrock2.tags;
truncate table bedrock2.connections;
truncate table bedrock2.custom_fields;
truncate table bedrock2.asset_types;
truncate table bedrock2.assets;
truncate table bedrock2.dependencies;
truncate table bedrock2.run_groups;
truncate table bedrock2.tasks;
truncate table bedrock2.asset_tags;
truncate table bedrock2.custom_values;
truncate table bedrock2.etl;
truncate table bedrock2.asset_type_custom_fields;
truncate table bedrock2.owners;