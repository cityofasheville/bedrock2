# sam local invoke  -d 9999 "TableCopy" -e sam_local_event.json  # DEBUG

# sam local invoke "TableCopy" -e sam_event.json 2> xx.txt       # send outputs to file

sam local invoke "CopySince" -e sam_local_event2.json

# sam local invoke "TestTimeout" 
