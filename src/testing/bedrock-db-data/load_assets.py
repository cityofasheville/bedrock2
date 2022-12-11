import os
import json
import sys

def usage():
    print('  Usage:  load_assets database-host')

if len(sys.argv) < 2:
    usage()
    sys.exit(2)

db_host = sys.argv[1].split(':')[0]
db_name = 'bedrock'
db_user = 'bedrock'
db_password = 'test-bedrock'

print("Database host is ", db_host)

assets_directory = './assets'
for item in os.listdir(assets_directory):
  d = os.path.join(assets_directory, item)
  if os.path.isdir(d):
    print('Process ',item)
    files = []
    for file in os.listdir(d):
      files.append(file)
    print('  total files is ', len(files))

