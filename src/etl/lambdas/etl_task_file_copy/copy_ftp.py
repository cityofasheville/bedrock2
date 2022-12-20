import paramiko
import io

def get_ftp(location):
    try:
        sftp = connectToFTP(location["connection_data"])
        file_to_get = location["tempfile"]

        sftp.get(location["path"] + location["filename"], file_to_get)

        print('Downloaded from FTP: ' + location["filename"])
        sftp.close() 
    except BaseException as err:
        raise Exception("Get FTP Error: " + str(err))

def put_ftp(location):
    try:
        sftp = connectToFTP(location["connection_data"])
        file_to_put = location["tempfile"]
        sftp.put(file_to_put, location["path"] + location["filename"])

        print('Uploaded To FTP: ' + location["filename"])
        sftp.close() 
    except BaseException as err:
        raise Exception("Put FTP Error: " + str(err))

def connectToFTP(connection_data):
    try:
        ftp_host = connection_data['host']
        ftp_port = connection_data['port']
        ftp_user = connection_data['username']
        transport = paramiko.Transport((ftp_host, int(ftp_port)))
        transport.start_client(timeout=60)

        if 'password' in connection_data.keys():
            transport.auth_password(username = ftp_user, password = connection_data['password'])
        elif 'privateKey' in connection_data.keys():
            pk = paramiko.RSAKey.from_private_key(io.StringIO(connection_data['privateKey']))
            transport.auth_publickey(username = ftp_user, key = pk)
        sftp = paramiko.SFTPClient.from_transport(transport)
        return sftp
    except BaseException as err:
        raise Exception("Connect to FTP Error: " + str(err))
 