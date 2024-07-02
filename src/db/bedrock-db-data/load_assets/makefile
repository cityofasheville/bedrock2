include ../../../make_variables

node_modules:
	npm install

local: node_modules
	@export BEDROCK_DB_HOST=$(BEDROCK_DB_HOST);export BEDROCK_DB_USER=$(BEDROCK_DB_USER); \
	export BEDROCK_DB_SCHEMA=$(BEDROCK_DB_SCHEMA) \
	export BEDROCK_DB_PASSWORD=$(BEDROCK_DB_PASSWORD);export BEDROCK_DB_NAME=$(BEDROCK_DB_NAME);node load_assets.js