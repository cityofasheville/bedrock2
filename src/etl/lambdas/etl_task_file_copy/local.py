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

ret = lambda_handler(event, context)
print(ret)
