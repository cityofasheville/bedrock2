import paramiko
import re
import io
import time 

def get_ftp(location):
    try:
        sftp = connectToFTP(location["connection_data"])
        file_to_get = location["tempfile"]
        source_file = location["filename"]
        if source_file.startswith("/"):
            pat = source_file[1:-1]
            rengine = re.compile(pat)
            files = sftp.listdir_attr(location["path"]);
            lf = []
            for f in files:
                if (re.fullmatch(rengine, f.filename)):
                    lf.append({"name": f.filename, "time": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(f.st_atime))})
            sort = "time"
            reverse = True
            if ("config" in location):
                config = location["config"]
                if ("sort" in config and config["sort"] == "name"):
                    sort = "name"
                if ("pick" in config and (config["pick"] == 0 or config["pick"] == "first")):
                    reverse = False
            lf.sort(key=lambda x: x[sort], reverse=reverse)

            source_file = lf[0]["name"]


        sftp.get(location["path"] + source_file, file_to_get)

        print('Downloaded from FTP: ' + source_file)
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
        if 'disabled_algorithms' in connection_data:
            disabled_algorithms = connection_data['disabled_algorithms']
        else:
            disabled_algorithms = None
        transport = paramiko.Transport(ftp_host +
                                       ':' + str(ftp_port),
                                       disabled_algorithms=disabled_algorithms
                                       )
        transport.start_client(timeout=60)

        if 'password' in connection_data.keys():
            transport.auth_password(
                    username=ftp_user, password=connection_data['password'])
        elif 'private_key' in connection_data.keys():
            pk = paramiko.RSAKey.from_private_key(
                    io.StringIO(connection_data['private_key']))
            transport.auth_publickey(username=ftp_user, key=pk)
        sftp = paramiko.SFTPClient.from_transport(transport)
        return sftp
    except BaseException as err:
        raise Exception("Connect to FTP Error: " + str(err))
 