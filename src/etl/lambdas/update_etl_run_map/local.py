from handler import lambda_handler
import sys
import json

event = {}
context = {}

filename = 'localtest.json'
if len(sys.argv) == 2:
    filename = sys.argv[1]

f = open(filename)
event = json.load(f)
f.close()

json_object = json.dumps(lambda_handler(event, context), indent = 4) 
# print(json_object) 
