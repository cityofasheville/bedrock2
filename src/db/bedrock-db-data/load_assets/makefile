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

local: node_modules
	node load_assets.js
