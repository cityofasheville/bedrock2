include ../../../make_variables

dirs = build
.PHONY: $(dirs) init plan apply destroy prebuild local clean

SRC_DIR := ./deploy
DEST_DIR := ./build
TFFILES := config.tf datablocks.tf backend.tf local.tfvars variables.tf makefile

code_files = ./handler.py

TF_TARGS := $(patsubst %,$(DEST_DIR)/%,$(TFFILES))

prebuild:
	mkdir -p ./build

$(DEST_DIR)/%: $(SRC_DIR)/% ../../../make_variables
	python3 ../../../scripts/vreplace.py -f ../../../make_variables $< $@

init: prebuild $(TF_TARGS)
	$(MAKE) -C build $(MAKECMDGOALS)
	@rm -f *.instance
	@touch $(INSTANCE).instance		# Marker file to display the instance name

function.zip: $(code_files)
	zip -r9 function.zip $(code_files)

plan: function.zip $(TF_TARGS) $(dirs)
apply: function.zip $(TF_TARGS) $(dirs)
apply-y: function.zip $(TF_TARGS) $(dirs)
destroy: $(TF_TARGS) $(dirs)

local:
	python3 local.py

clean:
	rm -f *.instance
	\rm -Rf build function.zip __pycache__

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)