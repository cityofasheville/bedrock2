include ../../../make_variables
-include ../../make_variables.generated

.EXPORT_ALL_VARIABLES:

code_files = *.js package.json

.PHONY: seed init plan apply apply-y destroy db local

clean:
	echo 'Nothing to clean'

node_modules: ./package.json
	npm install

local: node_modules
	node load_files.js
