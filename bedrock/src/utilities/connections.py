import os
import json

def get_connections(s3, bucket_name, tmpfilepath):
    s3.download_file(bucket_name, "run/bedrock_connections.json", tmpfilepath)
    with open(tmpfilepath, "r") as file_content:
        connections = json.load(file_content)
    os.remove(tmpfilepath)
    return connections

