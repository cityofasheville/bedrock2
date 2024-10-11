include ../../make_variables
-include ../../db/make_variables.generated

.EXPORT_ALL_VARIABLES:

# If vars are not set in make_variables, check for make_variables.generated file and set defaults
devhostname := $(shell echo $(BEDROCK_DB_HOST_ENDPOINT) | cut -d ":" -f 1)
ifndef BEDROCK_DB_HOST
BEDROCK_DB_HOST=$(devhostname)
endif
ifndef BEDROCK_DB_USER
BEDROCK_DB_USER=bedrock
endif
ifndef BEDROCK_DB_PASSWORD
BEDROCK_DB_PASSWORD=test-bedrock
endif
ifndef BEDROCK_DB_NAME
BEDROCK_DB_NAME=bedrock
endif

dirs = build

.PHONY: $(dirs) init plan apply destroy prebuild db seed

SRC_DIR := ./deploy
DEST_DIR := ./build
TFFILES := config.tf backend.tf local.tfvars variables.tf makefile

TF_TARGS := $(patsubst %,$(DEST_DIR)/%,$(TFFILES))

prebuild:
	mkdir -p ./build

$(DEST_DIR)/%: $(SRC_DIR)/% ../../make_variables
	python3 ../../scripts/vreplace.py -v BEDROCK_DB_USER=$(BEDROCK_DB_USER) -v BEDROCK_DB_PASSWORD=$(BEDROCK_DB_PASSWORD) \
		-v BEDROCK_DB_NAME=$(BEDROCK_DB_NAME) -f ../../make_variables $< $@

init: prebuild $(TF_TARGS)
	$(MAKE) -C build $(MAKECMDGOALS)
	@rm -f *.instance
	@touch $(INSTANCE).instance		# Marker file to display the instance name
	
plan: $(dirs) $(TF_TARGS)
apply: $(TF_TARGS) $(dirs)
apply-y: $(TF_TARGS) $(dirs)
destroy: $(dirs)

db:
	make local

node_modules: ./package.json
	npm install

local: node_modules
	node create_db.js

clean:
	rm -f *.instance
	\rm -Rf build
	\rm -Rf node_modules
	echo "" > ../make_variables.generated

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)