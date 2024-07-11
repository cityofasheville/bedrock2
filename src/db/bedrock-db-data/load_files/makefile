include ../../../make_variables

code_files = *.js package.json

.PHONY: seed init plan apply apply-y destroy db local

clean:
	echo 'Nothing to clean'

node_modules: $(code_files)
	npm install

local: node_modules
	@export BEDROCK_DB_HOST=$(BEDROCK_DB_HOST) \
	export BEDROCK_DB_USER=$(BEDROCK_DB_USER) \
	export BEDROCK_DB_SCHEMA=$(BEDROCK_DB_SCHEMA) \
	export BEDROCK_DB_PASSWORD=$(BEDROCK_DB_PASSWORD) \
	export BEDROCK_DB_NAME=$(BEDROCK_DB_NAME) \
	export data_directory=$(data_directory) \
	node load_files.js
