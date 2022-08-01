import boto3

s3 = boto3.client('s3')
        
def download_s3(location):
    try:
        s3.download_file(
            location["connection_data"]["s3_bucket"], 
            location["path"] + location["filename"], 
            location["tempfile"])
        print("File retrieved from S3: " + location["filename"])
    except BaseException as err:
        raise Exception("Download S3 Error: " + str(err))

def upload_s3(location):
    try:
        s3.upload_file(
            location["tempfile"], 
            location["connection_data"]["s3_bucket"], 
            location["path"] + location["filename"])
        print ('File loaded to S3: ' + location["filename"])
    except BaseException as err:
        raise Exception("Upload S3 Error: " + str(err))
 