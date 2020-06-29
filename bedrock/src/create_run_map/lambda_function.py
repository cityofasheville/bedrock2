import json
from create_run_map import create_run_map_function

def lambda_handler(event, context):
    result = create_run_map_function('managed-data-assets-dev', 'daily')
    return {
        'statusCode': 200,
        'body': json.dumps(result)
    }

# r = lambda_handler(None, None)
# print(r)

