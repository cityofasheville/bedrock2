from smb.SMBConnection import SMBConnection

def get_win(location):
  fileResult = { "fileFound": True, "fileName": location["filename"] }
  try:
    connection_data = location["connection_data"]
    share_name = connection_data['share_name']
    file_path = location["path"] + location["filename"]
    tempfilename = location["tempfile"]
    conn = connectToWindows(connection_data)
    file_obj = open(tempfilename,'wb')
    file_attributes, filesize = conn.retrieveFile(share_name, file_path, file_obj)
  except BaseException as err:
    raise Exception("Get Windows file share Error: " + str(err))
  return fileResult

def put_win(location):
  try:
    connection_data = location["connection_data"]
    share_name = connection_data['share_name']
    file_path = location["path"] + location["filename"]
    tempfilename = location["tempfile"]
    conn = connectToWindows(connection_data)
    file_obj = open(tempfilename,'rb')
    conn.storeFile(share_name, file_path, file_obj)
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



