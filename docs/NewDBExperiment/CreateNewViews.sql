create view bedrock2.asset_tag_view as
select a.asset_name, tags.tag_name 
from bedrock2.asset_tags at2
inner join bedrock2.assets a
on at2.asset_id = a.asset_id 
inner join bedrock2.tags
on at2.tag_id = tags.tag_id;

create view bedrock2.asset_type_custom_field_view as
select asset_type_name, custom_field_name, required
from bedrock2.asset_types at2 
inner join bedrock2.asset_type_custom_fields atcf
on at2.asset_type_id = atcf.asset_type_id
inner join bedrock2.custom_fields cf 
on atcf.custom_field_id = cf.custom_field_id; 

create view bedrock2.asset_type_view as
select at2.asset_type_name, at3.asset_type_name parent_name
from bedrock2.asset_types at2 
left join bedrock2.asset_types at3 
on at2.parent = at3.asset_type_id;

create view bedrock2.asset_view as
select asset_id, asset_name, description, "location", asset_type_name, owner_id, notes, link, active
FROM bedrock2.assets a
left join bedrock2.asset_types at2
on a.asset_type_id = at2.asset_type_id;

create view bedrock2.dependency_view as
select dep.asset_id, as2.asset_name, dep.dependent_asset_id, as3.asset_name dependency
from bedrock2.dependencies dep
inner join bedrock2.assets as2 
on as2.asset_id = dep.asset_id
inner join bedrock2.assets as3 
on dep.dependent_asset_id = as3.asset_id
	union -- add aggregate dependencies
select a1.asset_id, a1.asset_name, a2.asset_id dependency_id, a2.asset_name as dependency from
bedrock2.assets a1
inner join bedrock2.tasks t 
on a1.asset_id = t.asset_id
inner join bedrock2.tags
on t.source->>'aggregate' = tags.tag_name 
inner join bedrock2.asset_tags at2
on tags.tag_id = at2.tag_id 
inner join bedrock2.assets a2 
on a2.asset_id = at2.asset_id 
where t.type = 'aggregate'
	union -- add copy dependencies
select a1.asset_id, a1.asset_name, a2.asset_id dependency_id, a2.asset_name as dependency from
bedrock2.assets a1
inner join bedrock2.tasks t 
on a1.asset_name = t.target->>'asset'
inner join bedrock2.assets a2 
on a2.asset_name = t.source->>'asset'
where t.type in ('table_copy','file_copy');

create view bedrock2.etl_view as 
select asset_name, run_group_name, etl.active 
from bedrock2.etl
inner join bedrock2.assets
on etl.asset_id = assets.asset_id 
inner join bedrock2.run_groups rg 
on etl.run_group_id = rg.run_group_id; 

create view bedrock2.task_view as
SELECT asset_name, seq_number, tasks.description, "type", tasks.active, "source", target, "configuration"
FROM bedrock2.tasks
inner join bedrock2.assets a 
on tasks.asset_id = a.asset_id; 

create view bedrock2.custom_value_view as
select a.asset_name, cf.custom_field_name, cf.field_type, cf.field_data 
from bedrock2.custom_values cv
inner join bedrock2.assets a
on cv.asset_id = a.asset_id 
inner join bedrock2.custom_fields cf 
on cv.custom_field_id = cf.custom_field_id;

GRANT SELECT ON TABLE bedrock2.asset_type_custom_field_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock2.asset_tag_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock2.asset_type_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock2.dependency_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock2.etl_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock2.task_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock2.asset_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock2.custom_value_view TO bedrock_user;