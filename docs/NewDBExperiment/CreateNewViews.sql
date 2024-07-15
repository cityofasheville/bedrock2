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
   FROM dependencies dep
     JOIN assets as2 ON as2.asset_id = dep.asset_id
     JOIN assets as3 ON dep.dependent_asset_id = as3.asset_id
UNION
 SELECT a1.asset_id,
    a1.asset_name,
    a2.asset_id AS dependent_asset_id,
    a2.asset_name AS dependency,
    true as implied_dependency
   FROM assets a1
     JOIN tasks t ON a1.asset_id = t.asset_id
     JOIN tags ON (t.source ->> 'aggregate'::text) = tags.tag_name
     JOIN asset_tags at2 ON tags.tag_id = at2.tag_id
     JOIN assets a2 ON a2.asset_id = at2.asset_id
  WHERE t.type = 'aggregate'::text
UNION
 SELECT a1.asset_id,
    a1.asset_name,
    a2.asset_id AS dependent_asset_id,
    a2.asset_name AS dependency,
    true as implied_dependency
   FROM assets a1
     JOIN tasks t ON a1.asset_name = (t.target ->> 'asset'::text)
     JOIN assets a2 ON a2.asset_name = (t.source ->> 'asset'::text)
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

GRANT SELECT ON TABLE bedrock.asset_type_custom_field_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock.asset_tag_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock.asset_type_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock.dependency_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock.etl_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock.task_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock.asset_view TO bedrock_user;
GRANT SELECT ON TABLE bedrock.custom_value_view TO bedrock_user;