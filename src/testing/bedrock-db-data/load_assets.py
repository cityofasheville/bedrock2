import os
import json
import sys
import psycopg2

def usage():
    print('  Usage:  load_assets database-host')

if len(sys.argv) < 2:
    usage()
    sys.exit(2)

db_host = sys.argv[1].split(':')[0]
db_name = 'bedrock'
db_user = 'bedrock'
db_password = 'test-bedrock'

conn = psycopg2.connect(
    host = db_host,
    dbname = db_name,
    password = db_password,
    user = db_user
  )
cur = conn.cursor()

print("Database host is ", db_host)

assets_directory = './assets'
for item in os.listdir(assets_directory):
  d = os.path.join(assets_directory, item)
  if os.path.isdir(d):
    print('Process ',item)
    configFile = None
    etlFile = None
    for file in os.listdir(d):
      if file == item + '.json':
        with open(os.path.join(d,file), 'r') as ff:
          config = json.load(ff)
          print(json.dumps(config))
      elif file == item + '.etl.json':
        etl = None
    sql = f'''
      insert into bedrock.assets
      (asset_name, description, location, active)
      values('{config["name"]}', '{config["description"]}', '{config["location"]}', {"true" if config["active"] else "false"})
      returning asset_name;
    '''
    print('   ', sql)
    cur.execute(sql)
    nm = cur.fetchone()[0]
    print('   Got the return value ', nm)

conn.commit()
cur.close()
conn.close()



# /*
# INSERT INTO bedrock.tasks
# (asset_name, seq_number, "type", active, "source", target, "configuration")
# VALUES('ad_info', 1, 'table_copy', true, '{"connection": "munis/munprod/mssqlgisadmin","schemaname": "amd","tablename": "ad_info"}', 
# '{"connection": "pubrecdb1/mdastore1/dbadmin","schemaname": "internal","tablename": "ad_info"}', null);

# INSERT INTO bedrock.tasks
# (asset_name, seq_number, "type", active, "source", target, "configuration")
# VALUES('somesql', 1, 'sql', true, null, 
# '{"connection": "pubrecdb1/mdastore1/dbadmin"}', 'select * from tablename');
# */