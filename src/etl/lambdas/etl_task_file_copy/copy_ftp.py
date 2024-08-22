import paramiko  # SFTP
import re        # RegEx
import io
import time 

def get_ftp(location):
    try:
        sftp = connectToFTP(location["connection_data"])
        source_file = location["filename"]
        if source_file.startswith("/"):
            pat = source_file[1:-1]
            rengine = re.compile(pat)

            sort = "time"
            reverse = True
            max_age = 60000 # Default to 1000 days
            if "config" in location:
                config = location["config"]
                if "sort" in config and config["sort"] == "name":
                    sort = "name"
                if "pick" in config and (config["pick"] == 0 or config["pick"] == "first"):
                    reverse = False
                if "max_age" in config:
                    max_age = 1 * config["max_age"]

            files = sftp.listdir_attr(location["path"]);
            lf = []
            cur = time.time()
            for f in files:
                keep = ((cur - f.st_mtime)/(60 * 60)) < max_age
                if re.fullmatch(rengine, f.filename) and keep:
                    lf.append({"name": f.filename, "time": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(f.st_mtime))})

            if len(lf) > 0:
                lf.sort(key=lambda x: x[sort], reverse=reverse)
                source_file = lf[0]["name"]
            else:
                source_file = None
        fileResult = { "fileFound": True, "fileName": source_file }
        if not source_file:
            print('No recent source file matching pattern found')
            fileResult["fileFound"] = False
        else:
            stream = sftp.open(location["path"] + source_file, mode='r')
            print('Downloaded from FTP: ' + source_file)
            fileResult["stream"] = stream
    except FileNotFoundError as err:
        print('No source file found in FTP')
        fileResult = { "fileFound": False, "fileName": None, "stream": None }            
    except BaseException as err:
        # print(type(err))
        raise Exception("Get FTP Error: " + str(err))

    return fileResult

def put_ftp(location, from_stream):
    try:
        sftp = connectToFTP(location["connection_data"])
        to_stream = sftp.open(location["path"] + location["filename"], mode='w')

        for line in from_stream:
            to_stream.write(line)
        to_stream.close()
        from_stream.close()

        print('Uploaded To FTP: ' + location["filename"])
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
 