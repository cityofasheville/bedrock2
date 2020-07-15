docker run --name local_postgres -p 5432:5432 -e POSTGRES_PASSWORD=password -d postgres
docker run -d --name telestaff_mssql -e 'ACCEPT_EULA=Y' -e 'SA_PASSWORD=P@55w0rd' \
    -e 'MSSQL_PID=Developer' -p 1433:1433 microsoft/mssql-server-linux:2017-latest

docker pull amazon/aws-stepfunctions-local
docker run --name step_function_local -p 8083:8083 \
    --env-file aws-stepfunctions-local-credentials.txt amazon/aws-stepfunctions-local

# https://www.softwaredeveloper.blog/initialize-mssql-in-docker-container
# https://medium.com/@wkrzywiec/database-in-a-docker-container-how-to-start-and-whats-it-about-5e3ceea77e50

#Using Dockerfile
cd Postgres
docker build -t local_postgres_image .
cd ../SQLServer
docker build -t local_sqlserver_image .
cd ..
docker run -d --name local_postgres_ -p 5555:5432 local_postgres_image
docker run -d --name local_sqlserver -p 1433:1433 local_sqlserver_image


#SAM
sam local start-api
sam local start-lambda