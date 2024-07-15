include ../../../make_variables
-include ../../make_variables.generated

code_files = *.js package.json

.PHONY: local init plan apply apply-y destroy db seed clean

clean:
	rm -rf node_modules

seed:
	make local

node_modules: ./package.json
	npm install

devhostname := $(shell echo $(BEDROCK_DB_HOST_ENDPOINT) | cut -d ":" -f 1)
ifdef BEDROCK_DB_HOST_ENDPOINT
override BEDROCK_DB_HOST=$(devhostname)
override BEDROCK_DB_USER=bedrock;
override BEDROCK_DB_SCHEMA=bedrock;
override BEDROCK_DB_PASSWORD=test-bedrock;
override BEDROCK_DB_NAME=bedrock;
endif

local: node_modules
	@export BEDROCK_DB_HOST=$(BEDROCK_DB_HOST) \
	export BEDROCK_DB_USER=$(BEDROCK_DB_USER) \
	export BEDROCK_DB_SCHEMA=$(BEDROCK_DB_SCHEMA) \
	export BEDROCK_DB_PASSWORD=$(BEDROCK_DB_PASSWORD) \
	export BEDROCK_DB_NAME=$(BEDROCK_DB_NAME) \
	export data_directory=$(data_directory) \
	node load_assets.js
