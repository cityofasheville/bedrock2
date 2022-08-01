import paramiko
import boto3
import json
import io
import datetime

WORKINGDIR = '/tmp/'
region_name = "us-east-1"

def fillDateTemplate(filename):
    filename = filename.replace('${','{')
    now = datetime.datetime.now()
    year = now.year
    month = now.strftime("%m")
    day = now.strftime("%d")
    hour = now.strftime("%H")
    minute = now.strftime("%M")
    second = now.strftime("%S")
    return (filename.format(YYYY=year,MM=month,DD=day,HH=hour,mm=minute,SS=second))

def put_ftp(sftp, ftp_path, filename):
    try:
        file_to_put = WORKINGDIR + filename
        sftp.put(file_to_put, ftp_path + filename)

        print('Uploaded To FTP: ' + filename)
    except BaseException as err:
        raise Exception("Put FTP Error: " + str(err))

def get_ftp(sftp, ftp_path, filename):
    try:
        file_to_get = WORKINGDIR + filename

        sftp.get(ftp_path + filename, file_to_get)

        print('Downloaded from FTP: ' + filename)
    except BaseException as err:
        raise Exception("Get FTP Error: " + str(err))

def list_ftp(sftp, ftp_path):
    try:
        filelist = sftp.listdir(ftp_path)

        print('File list: ', filelist)
        return filelist
    except BaseException as err:
        raise Exception("List FTP Error: " + str(err))

def del_ftp(sftp, ftp_path, filename):
    try:
        sftp.unlink(ftp_path + filename)

        print('File deleted from FTP: ' + filename)
    except BaseException as err:
        raise Exception("Del FTP Error: " + str(err))

def download_s3(s3, s3_bucket, s3_path, filename):
    try:
        downloaded_file = WORKINGDIR + filename
        s3.download_file(s3_bucket, s3_path + filename, downloaded_file)
        print("File retrieved from S3: " + filename)
    except BaseException as err:
        raise Exception("Download S3 Error: " + str(err))

def upload_s3(s3, s3_bucket, s3_path, filename):
    try:
        uploaded_file = WORKINGDIR + filename
        s3.upload_file(uploaded_file, s3_bucket, s3_path + filename)
        print ('File loaded to S3: ' + filename)
    except BaseException as err:
        raise Exception("Upload S3 Error: " + str(err))

def getConnection(secret_name):
    try:
        session = boto3.session.Session()
        client = session.client(
            service_name='secretsmanager',
            region_name=region_name,
        )
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
        results = json.loads(get_secret_value_response['SecretString'])
        return results
    except BaseException as err:
        raise Exception("Connection Secret Error: " + str(err))

def connectToFTP(ftp_host, ftp_port, ftp_user, ftp_pw, ftp_keyfile):
    try:
        transport = paramiko.Transport((ftp_host, int(ftp_port)))
        transport.start_client(timeout=60)
        if ftp_pw is not None:
            transport.auth_password(username = ftp_user, password = ftp_pw)
        elif ftp_keyfile is not None:
            transport.auth_publickey(username = ftp_user, key = ftp_keyfile)
        sftp = paramiko.SFTPClient.from_transport(transport)
        return sftp
    except BaseException as err:
        raise Exception("Connect to FTP Error: " + str(err))

def lambda_handler(event, context):
    try:
        taskindex = event["TaskIndex"]
        etl = event["ETLJob"]["etl_tasks"][taskindex]
        if not etl["active"]:
            return {
                'statusCode': 200,
                'body': "Inactive: skipped"
            }
        filename = fillDateTemplate(etl["filename"])
        s3 = boto3.client('s3')
        if "s3_connection" in etl.keys():
            s3_conn_name = etl['s3_connection']
            s3_bucket = getConnection(s3_conn_name)["s3_bucket"]

        #  "ftp_connection" 
        ftp_conn_name = etl['ftp_connection']
        ftp_conn = getConnection(ftp_conn_name)
        ftp_host = ftp_conn['host']
        ftp_port = ftp_conn['port']
        ftp_user = ftp_conn['username']
        if 'password' in ftp_conn.keys():
            ftp_pw   = ftp_conn['password']
            sftp = connectToFTP(ftp_host, ftp_port, ftp_user, ftp_pw=ftp_pw, ftp_keyfile=None)
        if 'privateKey' in ftp_conn.keys():
            ftp_keyfile = ftp_conn['privateKey']
            filelikeobj = io.StringIO(ftp_keyfile)
            pk = paramiko.RSAKey.from_private_key(filelikeobj)
            sftp = connectToFTP(ftp_host, ftp_port, ftp_user, ftp_pw=None, ftp_keyfile=pk)
       

        if etl['action'] == "getall":
            filelist = list_ftp(sftp, etl['ftp_path'])
            for filenm in filelist:
                get_ftp(sftp, etl['ftp_path'], filenm)
                upload_s3(s3, s3_bucket, etl['s3_path'], filenm)
                del_ftp(sftp, etl['ftp_path'], filenm)
            retmsg = filelist
        if etl['action'] == "put":
            download_s3(s3, s3_bucket, etl['s3_path'], filename)
            put_ftp(sftp, etl['ftp_path'], filename)
            retmsg = ('Uploaded to FTP: ' + filename)
        if etl['action'] == "get":
            get_ftp(sftp, etl['ftp_path'], filename)
            upload_s3(s3, s3_bucket, etl['s3_path'], filename)
            retmsg = ('Downloaded from FTP: ' + filename)
        if etl['action'] == "list":
            filelist = list_ftp(sftp, etl['ftp_path'])
            retmsg = filelist
        if etl['action'] == "del":
            del_ftp(sftp, etl['ftp_path'], filename)
            retmsg = ('File deleted from FTP: ' + filename)
        
        sftp.close()
        # transport.close()

        return {
            'statusCode': 200,
            'body': retmsg
        }
    except BaseException as err:
        print(str(err))
        return {
            'statusCode': 500,
            'body': str(err)
        }
