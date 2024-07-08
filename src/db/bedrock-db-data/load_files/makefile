include ../../../make_variables
-include ../../make_variables.generated

.PHONY: seed init plan apply apply-y destroy db local

seed:	load_assets.py
	pip install -r ./requirements.txt
	python3 load_assets.py $(BEDROCK_DB_HOST_ENDPOINT)

clean:
	echo 'Nothing to clean'

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)

node_modules:
	npm install

local: node_modules
	@export BEDROCK_DB_HOST=$(BEDROCK_DB_HOST) \
	export BEDROCK_DB_USER=$(BEDROCK_DB_USER) \
	export BEDROCK_DB_SCHEMA=$(BEDROCK_DB_SCHEMA) \
	export BEDROCK_DB_PASSWORD=$(BEDROCK_DB_PASSWORD) \
	export BEDROCK_DB_NAME=$(BEDROCK_DB_NAME) \
	export data_directory=$(data_directory) \
	node load_files.js
