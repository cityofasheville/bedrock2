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

data_directory = './test_data'
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
  truncate table bedrock.run_groups;
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

# Load the assets
print('Load all assets')
assets_directory = data_directory + '/assets'
for asset_name in os.listdir(assets_directory):
  # each asset
  print('  Processing ', asset_name)
  d = os.path.join(assets_directory, asset_name)
  if os.path.isdir(d):
    for file in os.listdir(d):
      if file == asset_name + '.json':
        # configFile
        with open(os.path.join(d, file), 'r') as ff:
          config = json.load(ff)
          sql = f'''
            insert into bedrock.assets
            (asset_name, description, location, active)
            values(%s, %s, %s, %s);
          '''
          cur.execute(sql,
          (asset_name, config["description"], config["location"], config["active"]
          ))
          dependencies = config['depends']
          
          if dependencies:
            for depend in dependencies:
              sql = f'''
              insert into bedrock.dependencies(asset_name, dependency)
              values(%s, %s);
              '''
              cur.execute(sql, (asset_name, depend))
      elif file == asset_name + '.etl.json':
        # etlFile
        with open(os.path.join(d, file), 'r') as ff:
          etl = json.load(ff)
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
            if type == "table_copy" or type == "file_copy":
              # table_copy / file_copy
              sql = f'''
              insert into bedrock.tasks(asset_name, seq_number, description, type, active, source, target, configuration)
              values(%s, %s, %s, %s, %s, %s, %s, %s);
              '''
              cur.execute(sql, (asset_name, seq_number, description, type, task['active'], 
              json.dumps(task['source_location']), json.dumps(task['target_location']), None))
            elif type == "sql":
              # sql
              sql_filename = task['file']
              with open(os.path.join(d, sql_filename), 'r') as sqlfile:
                sqlstring = sqlfile.read()
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

    # nm = cur.fetchone()[0] # probably can skip this, but maybe to double check


conn.commit()
cur.close()
conn.close()
