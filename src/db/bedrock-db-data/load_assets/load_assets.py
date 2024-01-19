import os
import json
import csv
import sys
import psycopg2

def usage():
    print('  Usage:  load_assets database-host [data-directory]')

if len(sys.argv) < 2:
    usage()
    sys.exit(2)

db_host = sys.argv[1].split(':')[0]
db_name = 'bedrock'
db_user = 'bedrock'
db_password = 'test-bedrock'

data_directory = '../data'
if (len(sys.argv) > 2):
  data_directory = sys.argv[2]

conn = psycopg2.connect(
    host = db_host,
    dbname = db_name,
    password = db_password,
    user = db_user
  )
cur = conn.cursor()

print("Database host is ", db_host)
print("Data directory is ", data_directory)

# clear out old data
sql = f'''
  truncate table bedrock.assets;
  truncate table bedrock.dependencies;
  truncate table bedrock.etl;
  truncate table bedrock.tasks;
  truncate table bedrock.asset_tags;
  truncate table bedrock.tags;
  truncate table bedrock.run_groups;
  truncate table bedrock.connections;
  truncate table bedrock.custom_fields;
  truncate table bedrock.custom_values;
'''
cur.execute(sql)
print('Truncated all tables')

# Load the run groups
sql = 'INSERT INTO bedrock.run_groups (run_group_name,	cron_string) VALUES '
runGroups = []
with open(os.path.join(data_directory,'run_groups.csv')) as ff:
  rdr = csv.reader(ff)
  
  i = 0;
  rows = list(rdr)
  nrows = len(rows)
  for row in rows:
    i = i+1
    sql = f"{sql} ('{row[0]}', '{row[1]}')"
    if (i<nrows):
      sql = sql + ','
cur.execute(sql)
print(f'Wrote {nrows} items to the run_groups table')

# Load the tags
sql = 'INSERT INTO bedrock.tags (tag_name,	display_name) VALUES '
tags = []
with open(os.path.join(data_directory,'tags.csv')) as ff:
  rdr = csv.reader(ff)
  
  i = 0;
  rows = list(rdr)
  nrows = len(rows)
  for row in rows:
    i = i+1
    sql = f"{sql} ('{row[0]}', '{row[1]}')"
    if (i<nrows):
      sql = sql + ','
cur.execute(sql)
print(f'Wrote {nrows} items to the tags table')

# Load the connections
sql = 'INSERT INTO bedrock.connections (connection_name, description, connection_class) VALUES '
tags = []
with open(os.path.join(data_directory,'connections.csv')) as ff:
  rdr = csv.reader(ff)
  
  i = 0;
  rows = list(rdr)
  nrows = len(rows)
  for row in rows:
    i = i+1
    sql = f"{sql} ('{row[0]}', '{row[1]}', '{row[2]}')"
    if (i<nrows):
      sql = sql + ','
cur.execute(sql)
print(f'Wrote {nrows} items to the connections table')

# Load the custom fields
customs_map = {}
sql = 'INSERT INTO bedrock.custom_fields (asset_type, field_name,	field_display, field_type) VALUES '
with open(os.path.join(data_directory,'custom_fields.csv')) as ff:
  rdr = csv.reader(ff)
  
  i = 0;
  rows = list(rdr)
  nrows = len(rows)
  for row in rows:
    i = i+1
    sql = f"{sql} ('{row[0]}', '{row[1]}', '{row[2]}', '{row[3]}')"
    if row[0] not in customs_map:
      customs_map[row[0]] = []
    customs_map[row[0]].append(row[1]);
    if (i<nrows):
      sql = sql + ','
cur.execute(sql)
print(f'Wrote {nrows} items to the custom fields table')

# Load the assets
print('Load all assets')
assets_directory = data_directory + '/assets'
for asset_subdir in os.listdir(assets_directory):
  # each asset
  print('  Processing ', asset_subdir)
  d = os.path.join(assets_directory, asset_subdir)
  if os.path.isdir(d):
    for file in os.listdir(d):
      if file.endswith('.ETL.json') or file.endswith('.etl.json'):
        # etlFile
        with open(os.path.join(d, file), 'r') as ff:
          etl = json.load(ff)
          asset_name = etl['asset_name']
          sql = f'''
          insert into bedrock.etl(asset_name, run_group, active)
          values(%s, %s, %s);
          '''
          cur.execute(sql,(asset_name, etl['run_group'], "true"))
          tasks = etl['tasks']
          for seq_number, task in enumerate(tasks):
            type = task['type']
            if 'description' in task:
              description = task['description']
            else:
              description = None
            if type == "table_copy" or type == "file_copy" or type == "aggregate":
              # table_copy / file_copy
              sql = f'''
              insert into bedrock.tasks(asset_name, seq_number, description, type, active, source, target, configuration)
              values(%s, %s, %s, %s, %s, %s, %s, %s);
              '''
              cur.execute(sql, (asset_name, seq_number, description, type, task['active'], 
              json.dumps(task['source_location']), json.dumps(task['target_location']), None))
            elif type == "sql":
              # sql
              sqlstring = task['sql_string']
              sql = f'''
              insert into bedrock.tasks(asset_name, seq_number, description, type, active, source, target, configuration)
              values(%s, %s, %s, %s, %s, %s, %s, %s);
              '''
              cur.execute(sql, (asset_name, seq_number, description, type, task['active'], 
              None, json.dumps({ "connection": task['connection'] }), sqlstring))
            else:
              # everything else
              sql = f'''
              insert into bedrock.tasks(asset_name, seq_number, description, type, active, source, target, configuration)
              values(%s, %s, %s, %s, %s, %s, %s, %s);
              '''
              cur.execute(sql, (asset_name, seq_number, description, type, task['active'], 
              None, json.dumps(task), None))
      elif file.endswith('.json'):
        # configFile
        with open(os.path.join(d, file), 'r') as ff:
          config = json.load(ff)
          asset_name = config['asset_name']
          sql = f'''
            insert into bedrock.assets
            (asset_name, description, location, owner_id, notes, active)
            values(%s, %s, %s, %s, %s, %s);
          '''
          cur.execute(sql,
          (asset_name, config["description"], json.dumps(config["location"]), config["owner_id"], config["notes"], config["active"]
          ))
          
          # custom variables
          if config['asset_type'] is not None and 'asset_type' in config and config['asset_type'] in customs_map:

            for itm in customs_map[config['asset_type']]:
              if itm in config:
                sql = f'''
                  insert into bedrock.custom_values
                  (asset_name, field_name, field_value)
                  values(%s, %s, %s);
                '''
                cur.execute(sql, (asset_name, itm, config[itm]))

          # dependencies
          dependencies = config['depends']         
          if dependencies:
            for depend in dependencies:
              sql = f'''
              insert into bedrock.dependencies(asset_name, dependency)
              values(%s, %s);
              '''
              cur.execute(sql, (asset_name, depend))
          
          # asset tags
          tags = config['tags']
          if tags:
            for tag in tags:
              sql = f'''
              insert into bedrock.asset_tags(asset_name, tag_name)
              values(%s, %s);
              '''
              cur.execute(sql, (asset_name, tag))              

    # nm = cur.fetchone()[0] # probably can skip this, but maybe to double check

conn.commit()
cur.close()
conn.close()
