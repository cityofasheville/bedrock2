# or? FROM mcr.microsoft.com/mssql/server:2017-latest-ubuntu
FROM microsoft/mssql-server-linux:2017-latest
ENV ACCEPT_EULA Y
ENV SA_PASSWORD P@55w0rd
ENV MSSQL_PID Developer
CMD /bin/bash ./ss_entrypoint.sh
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN chmod +x /usr/src/app/ss_run_init.sh
