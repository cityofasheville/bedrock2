from smb.SMBConnection import SMBConnection
from smb import smb_structs
import io

def get_win(location):
  fileResult = { "fileFound": True, "fileName": location["filename"] }
  # TODO check if file is found
  try:
    stream = io.BytesIO()
    connection_data = location["connection_data"]
    share_name = connection_data['share_name']
    file_path = location["path"] + location["filename"]
    conn = connectToWindows(connection_data)
    conn.retrieveFile(share_name, file_path, stream)
    stream.seek(0)
    fileResult = { "fileFound": True, "fileName": location["filename"], "stream": stream }
    print("File retrieved from Windows: " + location["filename"])
  except smb_structs.OperationFailure as err:
    print('No source file found in Windows')
    fileResult = { "fileFound": False, "fileName": location["filename"], "stream": None }
  except BaseException as err:
    fileResult = { "fileFound": False, "fileName": location["filename"], "stream": None }
    raise Exception("Get Windows file share Error: " + str(type(err)))
  return fileResult

def put_win(location,from_stream):
  try:
    connection_data = location["connection_data"]
    share_name = connection_data['share_name']
    file_path = location["path"] + location["filename"]
    conn = connectToWindows(connection_data)
    conn.storeFile(share_name, file_path, from_stream)
    print("File uploaded to Windows: " + location["filename"])    
  except BaseException as err:
    raise Exception("Put Windows file share Error: " + str(err))
    
def connectToWindows(connection_data):
  username = connection_data['username']
  password = connection_data['password']
  system_name = connection_data['system_name']
  domain = connection_data['domain']
  conn = SMBConnection(username,password,'name',system_name,domain,use_ntlm_v2=True,
                    sign_options=SMBConnection.SIGN_WHEN_SUPPORTED,
                    is_direct_tcp=True) 
  conn.connect(system_name,445)
  return conn



