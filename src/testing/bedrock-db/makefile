include ../../make_variables
include ../make_variables.local

dirs = build

.PHONY: $(dirs) init plan apply destroy prebuild

SRC_DIR := ./deploy
DEST_DIR := ./build
TFFILES := config.tf backend.tf local.tfvars variables.tf makefile

TF_TARGS := $(patsubst %,$(DEST_DIR)/%,$(TFFILES))

prebuild:
	mkdir -p ./build

$(DEST_DIR)/%: $(SRC_DIR)/%
	python3 ../../scripts/vreplace.py -f ../../make_variables $< $@


init: prebuild $(TF_TARGS)
	$(MAKE) -C build $(MAKECMDGOALS)
	@rm -f *.instance
	@touch $(INSTANCE).instance		# Marker file to display the instance name
	
plan: $(dirs) $(TF_TARGS)
apply: $(TF_TARGS) $(dirs)
apply-y: $(TF_TARGS) $(dirs)
destroy: $(dirs)

db:	create_db.js package.json package-lock.json
	npm install
	echo $(DB_ENDPOINT)
	DB_ENDPOINT=$(DB_ENDPOINT) node create_db.js

clean:
	rm -f *.instance
	\rm -Rf build
	\rm -Rf node_modules
	echo "" > ../make_variables.local

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)