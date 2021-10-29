import os
import json
from .constants import CONNECTIONS_PREFIX
from .print import print_list_in_columns

def get_connections(bucket_name, s3, tmpfilepath):
    s3.download_file(bucket_name, CONNECTIONS_PREFIX, tmpfilepath)
    with open(tmpfilepath, "r") as file_content:
        connections = json.load(file_content)
    os.remove(tmpfilepath)
    return connections

def get_connection(connection_name, bucket_name, s3, tmpfilepath):
    connections = get_connections(bucket_name, s3, tmpfilepath)
    if connection_name is None or connection_name not in connections:
        print("\nA connection name is required using the -c option. Must be one of the following:\n")
        print_list_in_columns(list(connections.keys()))
        return None
    return connections[connection_name]

