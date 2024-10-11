include ../../../make_variables
-include ../../make_variables.generated

.EXPORT_ALL_VARIABLES:

code_files = *.js package.json

.PHONY: local init plan apply apply-y destroy db seed clean

clean:
	rm -rf node_modules

seed:
	make local

node_modules: ./package.json
	npm install

devhostname := $(shell echo $(BEDROCK_DB_HOST_ENDPOINT) | cut -d ":" -f 1)

ifndef BEDROCK_DB_HOST
BEDROCK_DB_HOST=$(devhostname)
endif
ifndef BEDROCK_DB_USER
BEDROCK_DB_USER=bedrock
endif
ifndef BEDROCK_DB_SCHEMA
BEDROCK_DB_SCHEMA=bedrock
endif
ifndef BEDROCK_DB_PASSWORD
BEDROCK_DB_PASSWORD=test-bedrock
endif
ifndef BEDROCK_DB_NAME
BEDROCK_DB_NAME=bedrock
endif

local: node_modules
	node load_assets.js
