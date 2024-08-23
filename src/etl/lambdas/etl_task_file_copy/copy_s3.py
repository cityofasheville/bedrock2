import boto3
import io

s3 = boto3.client('s3')
        
def download_s3(location):
    try:
        response = s3.get_object(
            Bucket=location["connection_data"]["s3_bucket"], 
            Key=location["path"] + location["filename"]
            )
        print("File retrieved from S3: " + location["filename"])
        stream = response['Body']
        fileResult = { "fileFound": True, "fileName": location["filename"], "stream": stream }
        return fileResult
    except s3.exceptions.NoSuchKey as err:
        print('No source file found in S3')
        return { "fileFound": False, "fileName": None, "stream": None }
    except BaseException as err:
        print(str(err))
        raise Exception("Download S3 Error: " + str(err))

def upload_s3(location,stream):
    try:
        s3.upload_fileobj(
            stream,
            location["connection_data"]["s3_bucket"], 
            location["path"] + location["filename"]
            )
        print ('File loaded to S3: ' + location["filename"])
    except BaseException as err:
        raise Exception("Upload S3 Error: " + str(err))
 
