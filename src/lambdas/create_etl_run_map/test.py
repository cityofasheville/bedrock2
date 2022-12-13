#!/usr/bin/env python3
import psycopg2
import boto3
# from botocore.exceptions import ClientError
import os
import json
from toposort import toposort


def get_db_config():
    bedrock_user = os.environ.get(
        'CONNECTION', "nopubrecdb1/bedrock/bedrock_user")
    region_name = os.environ.get('AWS_REGION', "us-east-1")

    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    # try:
    get_secret_value_response = client.get_secret_value(
        SecretId=bedrock_user
    )
    # except ClientError as e:
    #     raise e
    return get_secret_value_response['SecretString']


def build_all_assets(run_group):
    all_assets = {}
    db_config = json.loads(get_db_config())

    conn = psycopg2.connect(
        host=db_config['host'],
        dbname=db_config['database'],
        password=db_config['password'],
        user=db_config['username']
    )
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM bedrock.etl where run_group = %s and active = true;", (run_group,))
    assets = cur.fetchall()
    for asset in assets:
        asset_name = asset[0]
        run_group = asset[1]
        cur.execute(
            "SELECT * FROM bedrock.dependencies where asset_name = %s;", (asset_name,))
        dependencies = list(map(lambda x: x[1], cur.fetchall()))
        cur.execute(
            "SELECT * FROM bedrock.tasks where asset_name = %s order by seq_number;", (asset_name,))
        tasksraw = cur.fetchall()  # array of tuples
        tasks = []
        for task in tasksraw:
            type = task[3]
            if (type == "table_copy" or type == "file_copy"):
                this_task = {
                    "type": type,
                    "active": task[4],
                    "source_location": task[5],
                    "target_location": task[6]
                }
                tasks.append(this_task)
            elif (type == "sql"):
                target = task[6]
                this_task = {
                    "type": type,
                    "active": task[4],
                    "connection": target["connection"],
                    "sql_string": task[7]
                }
                tasks.append(this_task)
            else:
                target = task[6]
                tasks.append(target)           
        all_assets[asset_name] = {
            "name": asset_name,
            "run_group": run_group,
            "depends": dependencies,
            "etl_tasks": tasks
        }

    with open("x.json", "w") as write_file:
        json.dump(all_assets, write_file, indent=2)

    cur.close()
    conn.close()
    return all_assets


def create_run_map_function(run_group):

    all_assets = build_all_assets(run_group)
#     dependency_map = {}
#     # Ought to be a more pythonic approach using filter() and lambda, but punting for now
#     for key, asset in all_assets.items():
#         if (asset['run_group'] == run_group):
#             dependency_map[key] = {a for a in asset['depends']}

#     runsets = list(toposort(dependency_map))
#     runs = []
#     while runsets:  # process each runset
#         runset = runsets.pop(0)
#         items = []
#         while runset:  # Process each job in the runset
#             item = runset.pop()  # Warning - this is a Set pop, not a List pop
#             items.append(all_assets[item])
#         runs.append(items)

#     result = {'RunSetIsGo': False}
#     if len(runs) > 0:
#         result['runsets'] = runs
# #        result['next'] = runs.pop()
# #        result['remainder'] = runs
#         result['RunSetIsGo'] = True
#         result['success'] = []
#         result['skipped'] = []
#         result['failure'] = []
#         result['results'] = None
# #        result['all_assets'] = all_assets
#     return result


result = create_run_map_function("daily")
# print (result)
