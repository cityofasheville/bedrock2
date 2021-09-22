docker tag sqlserver_ss1 bitslayer42/bedrock-test-ss1:1.0
docker tag postgres1_pg1 bitslayer42/bedrock-test-pg1:1.0
docker tag postgres2_pg2 bitslayer42/bedrock-test-pg2:1.0

docker push bitslayer42/bedrock-test-ss1:1.0
docker push bitslayer42/bedrock-test-pg1:1.0
docker push bitslayer42/bedrock-test-pg2:1.0
