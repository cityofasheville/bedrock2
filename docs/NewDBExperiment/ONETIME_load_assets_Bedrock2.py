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

sqlrando = 'substr(md5(random()::text), 1, 20)'
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
  truncate table bedrock2.assets;
  truncate table bedrock2.dependencies;
  truncate table bedrock2.etl;
  truncate table bedrock2.tasks;
  truncate table bedrock2.asset_tags;
  truncate table bedrock2.tags;
  truncate table bedrock2.run_groups;
  truncate table bedrock2.connections;
  truncate table bedrock2.custom_fields;
  truncate table bedrock2.custom_values;
  truncate table bedrock2.owners;
  truncate table bedrock2.asset_types;
  truncate table bedrock2.asset_type_custom_fields;
'''
cur.execute(sql)
print('Truncated all tables')

# Load the run groups
sql = 'INSERT INTO bedrock2.run_groups (run_group_id, run_group_name,	cron_string) VALUES '
with open(os.path.join(data_directory,'run_groups.csv')) as ff:
  rdr = csv.reader(ff)
  
  i = 0
  rows = list(rdr)
  nrows = len(rows)
  for row in rows:
    i = i+1
    sql = f"{sql} ({sqlrando}, '{row[0]}', '{row[1]}')"
    if (i<nrows):
      sql = sql + ','
cur.execute(sql)
print(f'Wrote {nrows} items to the run_groups table')

# Load the tags
sql = 'INSERT INTO bedrock2.tags (tag_id,	tag_name) VALUES '
tags = []
with open(os.path.join(data_directory,'tags.csv')) as ff:
  rdr = csv.reader(ff)
  
  i = 0
  rows = list(rdr)
  nrows = len(rows)
  for row in rows:
    i = i+1
    sql = f"{sql} ({sqlrando}, '{row[1]}')"
    if (i<nrows):
      sql = sql + ','
cur.execute(sql)
print(f'Wrote {nrows} items to the tags table')

# Load the connections
sql = 'INSERT INTO bedrock2.connections (connection_id, connection_name, secret_name, connection_class) VALUES '
tags = []
with open(os.path.join(data_directory,'connections.csv')) as ff:
  rdr = csv.reader(ff)
  
  i = 0
  rows = list(rdr)
  nrows = len(rows)
  for row in rows:
    i = i+1
    sql = f"{sql} ({sqlrando}, '{row[1]}', '{row[0]}', '{row[2]}')"
    if (i<nrows):
      sql = sql + ','
cur.execute(sql)
print(f'Wrote {nrows} items to the connections table')

# Load the asset types
sql = 'INSERT INTO bedrock2.asset_types (asset_type_id, asset_type_name) VALUES '
with open(os.path.join(data_directory,'asset_types.csv')) as ff:
  rdr = csv.reader(ff)
  
  i = 0
  rows = list(rdr)
  nrows = len(rows)
  for row in rows:
    i = i+1
    sql = f"{sql} ({sqlrando}, '{row[1]}')"
    if i < nrows:
      sql = sql + ','
  cur.execute(sql)
  print(f'Wrote {nrows} items to the asset types table')

# Load the custom fields

sql = 'INSERT INTO bedrock2.custom_fields (custom_field_id, custom_field_name, field_type, field_data) VALUES '
with open(os.path.join(data_directory,'custom_fields.csv')) as ff:
  rdr = csv.reader(ff)
  
  i = 0
  rows = list(rdr)
  nrows = len(rows)
  for row in rows:
    i = i+1
    sql = f"{sql} ({sqlrando}, '{row[1]}', '{row[2]}', '{row[3]}')"
    if (i<nrows):
      sql = sql + ','
cur.execute(sql)
print(f'Wrote {nrows} items to the custom fields table')


# Load the asset-type/custom-field connection table
customs_map = {}
sql = 'INSERT INTO bedrock2.asset_type_custom_fields (asset_type_custom_fields_id, asset_type_id,	custom_field_id, required) VALUES '
with open(os.path.join(data_directory,'asset_type_custom_fields.csv')) as ff:
  rdr = csv.reader(ff)
  
  i = 0
  rows = list(rdr)
  nrows = len(rows)
  for row in rows:
    i = i+1
    sql = f"{sql} ({sqlrando},{sqlrando},{sqlrando}, {row[2]})"
    if (i<nrows):
      sql = sql + ','
cur.execute(sql)
print(f'Wrote {nrows} items to the asset-type/custom-field connection table')

# Load the owners
sql = 'INSERT INTO bedrock2.owners (owner_id, owner_name, owner_email, owner_phone, organization, department, division, notes) VALUES '
with open(os.path.join(data_directory,'owners.csv')) as ff:
  rdr = csv.reader(ff)
  
  i = 0
  rows = list(rdr)
  nrows = len(rows)
  for row in rows:
    i = i+1
    sql = f"{sql} ({sqlrando}, '{row[1]}', '{row[2]}', '{row[3]}', '{row[4]}', '{row[5]}', '{row[6]}', '{row[7]}')"
    if (i<nrows):
      sql = sql + ','
cur.execute(sql)
print(f'Wrote {nrows} items to the owners table')

# # Load the assets
# print('Load all assets')
# assets_directory = data_directory + '/assets'
# for asset_subdir in os.listdir(assets_directory):
#   # each asset
#   print('  Processing ', asset_subdir)
#   d = os.path.join(assets_directory, asset_subdir)
#   if os.path.isdir(d):
#     for file in os.listdir(d):
#       if file.endswith('.ETL.json') or file.endswith('.etl.json'):
#         # etlFile
#         with open(os.path.join(d, file), 'r') as ff:
#           etl = json.load(ff)
#           asset_name = etl['asset_name']
#           sql = f'''
#           insert into bedrock2.etl(asset_name, run_group, active)
#           values(%s, %s, %s);
#           '''
#           cur.execute(sql,(asset_name, etl['run_group'], "true"))
#           tasks = etl['tasks']
#           for seq_number, task in enumerate(tasks):
#             type = task['type']
#             if 'description' in task:
#               description = task['description']
#             else:
#               description = None
#             if type == "table_copy" or type == "file_copy" or type == "aggregate":
#               # table_copy / file_copy
#               sql = f'''
#               insert into bedrock2.tasks(asset_name, seq_number, description, type, active, source, target, configuration)
#               values(%s, %s, %s, %s, %s, %s, %s, %s);
#               '''
#               cur.execute(sql, (asset_name, seq_number, description, type, task['active'], 
#               json.dumps(task['source_location']), json.dumps(task['target_location']), None))
#             elif type == "sql":
#               # sql
#               sqlstring = task['sql_string']
#               sql = f'''
#               insert into bedrock2.tasks(asset_name, seq_number, description, type, active, source, target, configuration)
#               values(%s, %s, %s, %s, %s, %s, %s, %s);
#               '''
#               cur.execute(sql, (asset_name, seq_number, description, type, task['active'], 
#               None, json.dumps({ "connection": task['connection'] }), sqlstring))
#             else:
#               # everything else
#               sql = f'''
#               insert into bedrock2.tasks(asset_name, seq_number, description, type, active, source, target, configuration)
#               values(%s, %s, %s, %s, %s, %s, %s, %s);
#               '''
#               cur.execute(sql, (asset_name, seq_number, description, type, task['active'], 
#               None, json.dumps(task), None))
#       elif file.endswith('.json'):
#         # configFile - load the asset itself
#         with open(os.path.join(d, file), 'r') as ff:
#           config = json.load(ff)
#           asset_name = config['asset_name']
#           sql = f'''
#             insert into bedrock2.assets
#             (asset_name, display_name, description, location, asset_type, owner_id, notes, link, active)
#             values(%s, %s, %s, %s, %s, %s, %s, %s, %s);
#           '''
#           cur.execute(sql,
#           (asset_name, config["display_name"], config["description"], json.dumps(config["location"]), config["asset_type"], config["owner_id"], config["notes"], config["link"], config["active"]
#           ))
          
#           # custom variables
#           # Note that we should validate the custom variables, but not
#           # doing it for now.
#           if 'custom_fields' in config and config['custom_fields'] is not None:
#             for itm in config['custom_fields']:
#                 sql = f'''
#                   insert into bedrock2.custom_values
#                   (asset_name, field_id, field_value)
#                   values(%s, %s, %s);
#                 '''
#                 cur.execute(sql, (asset_name, itm, config['custom_fields'][itm]))

#           # dependencies
#           dependencies = config['depends']         
#           if dependencies:
#             for depend in dependencies:
#               sql = f'''
#               insert into bedrock2.dependencies(asset_name, dependency)
#               values(%s, %s);
#               '''
#               cur.execute(sql, (asset_name, depend))
          
#           # asset tags
#           tags = config['tags']
#           if tags:
#             for tag in tags:
#               sql = f'''
#               insert into bedrock2.asset_tags(asset_name, tag_name)
#               values(%s, %s);
#               '''
#               cur.execute(sql, (asset_name, tag))              

#     # nm = cur.fetchone()[0] # probably can skip this, but maybe to double check

conn.commit()
cur.close()
conn.close()
