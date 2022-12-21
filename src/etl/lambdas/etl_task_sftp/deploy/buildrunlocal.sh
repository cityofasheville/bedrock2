# sam local invoke  -d 9999 "TableCopy" -e sam_local_event.json  # DEBUG

sam build --use-container
sam local invoke "ftppy" -e sam_event.json

