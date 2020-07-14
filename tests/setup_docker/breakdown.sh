
docker-compose -f Postgres1/docker-compose.yml down --rmi all -v --remove-orphans
docker-compose -f Postgres2/docker-compose.yml down --rmi all -v --remove-orphans
docker-compose -f SQLServer/docker-compose.yml down --rmi all -v --remove-orphans