INSERT INTO bedrock2.asset_types
(asset_type_id, asset_type_name)
SELECT substr(md5(random()::text), 1, 20) as asset_type_id,
at1.id
from bedrock.asset_types at1;

update bedrock2.asset_types 
set parent = inr.parent
from (
	select at1.id,  at3.asset_type_id parent
	from bedrock.asset_types at1
	left join bedrock.asset_types at2 
	on at1.parent = at2.id
	left join bedrock2.asset_types at3 
	on at2.id = at3.asset_type_name
) inr
where asset_types.asset_type_name = inr.id;

INSERT INTO bedrock2.connections
(connection_id, connection_name, secret_name, connection_class)
SELECT  substr(md5(random()::text), 1, 20)  as connection_id,
description as connection_name, connection_name as secret_name, connection_class
FROM bedrock.connections;

INSERT INTO bedrock2.custom_fields
(custom_field_id, custom_field_name, field_type, field_data)
SELECT substr(md5(random()::text), 1, 20) as custon_field_id, 
id as custom_field_name, field_type, field_data
FROM bedrock.custom_fields;

INSERT INTO bedrock2.owners
(owner_id, owner_name, owner_email, owner_phone, organization, department, division, notes)
SELECT substr(md5(random()::text), 1, 20) as owner_id, 
contact_name, contact_email, contact_phone, organization, department, division, notes
FROM bedrock.owners;

INSERT INTO bedrock2.run_groups
(run_group_id, run_group_name, cron_string)
SELECT substr(md5(random()::text), 1, 20) as run_group_id, 
run_group_name, cron_string
FROM bedrock.run_groups;

INSERT INTO bedrock2.tags
(tag_id, tag_name)
select substr(md5(random()::text), 1, 20) as tag_id, tag_name
FROM bedrock.tags;

INSERT INTO bedrock2.assets
(asset_id, asset_name, description, "location", asset_type_id, owner_id, notes, link, active)
SELECT substr(md5(random()::text), 1, 20) as asset_id, asset_name, description, 
    jsonb_set(
        location, 
        '{connection_id}', 
        to_jsonb(c.connection_id)
    ) - 'connection' AS location,
asset_type_id, owner_id, notes, link, active
FROM bedrock.assets a
inner join bedrock2.connections c 
on a.location->>'connection' = c.secret_name
inner join bedrock2.asset_types at2 
on a.asset_type = at2.asset_type_name;


INSERT INTO bedrock2.custom_values
(asset_id, custom_field_id, field_value)
select asset_id, custom_field_id, field_value 
from bedrock.custom_values cv
inner join bedrock2.custom_fields cf 
on cv.field_id = cf.custom_field_name 
inner join bedrock2.assets a 
on cv.asset_name = a.asset_name;

INSERT INTO bedrock2.etl
(asset_id, run_group_id, active)
SELECT
asset_id, run_group_id, true as active
from bedrock2.run_groups rg
inner join bedrock.etl etl
on rg.run_group_name = etl.run_group 
inner join bedrock2.assets ass
on etl.asset_name = ass.asset_name; 

INSERT INTO bedrock2.tasks
(task_id, asset_id, seq_number, description, "type", active, "source", target, "configuration")
SELECT substr(md5(random()::text), 1, 20) as task_id,
asset_id, seq_number, tk.description, "type", tk.active, "source", target, "configuration"
from bedrock2.assets ass
inner join bedrock.tasks tk
on ass.asset_name = tk.asset_name;

INSERT INTO bedrock2.dependencies
(asset_id, dependent_asset_id)
SELECT
ass1.asset_id, ass2.asset_id
from bedrock2.assets ass1
inner join bedrock.dependencies dep
on ass1.asset_name = dep.asset_name 
inner join bedrock2.assets ass2
on dep.dependency = ass2.asset_name
union -- add the aggregates
select
as1.asset_id, as2.asset_id as dependent_asset_id
from bedrock.dependencies dep
left join bedrock2.assets as1
on dep.asset_name = as1.asset_name
left join bedrock.asset_tags ast
on dep.dependency = '#' || ast.tag_name
left join bedrock2.assets as2
on ast.asset_name = as2.asset_name
where dep.dependency like '#%';


INSERT INTO bedrock2.asset_tags
(asset_id, tag_id)
SELECT asset_id, tag_id
from bedrock2.assets ass
inner join bedrock.asset_tags aat
on ass.asset_name = aat.asset_name 
inner join bedrock2.tags 
on aat.tag_name = tags.tag_name;

INSERT INTO bedrock2.asset_type_custom_fields
(asset_type_id, custom_field_id, required)
SELECT
at2.asset_type_id, cf2.custom_field_id, required
from bedrock2.asset_types at2 
inner join bedrock.asset_type_custom_fields atcf
on at2.asset_type_name = atcf.asset_type_id 
inner join bedrock.custom_fields cf 
on atcf.custom_field_id = cf.id
inner join bedrock2.custom_fields cf2 
on cf.id = cf2.custom_field_name ;


