include ../../make_variables

dirs = build
.PHONY: $(dirs) init plan apply destroy prebuild

SRC_DIR := ./deploy
DEST_DIR := ./build
TFFILES := config.tf backend.tf local.tfvars variables.tf makefile

TF_TARGS := $(patsubst %,$(DEST_DIR)/%,$(TFFILES))

prebuild:
	mkdir -p ./build

$(DEST_DIR)/%: $(SRC_DIR)/% ../../make_variables
	python3 ../../scripts/vreplace.py -f ../../make_variables $< $@

init: prebuild $(TF_TARGS)
	$(MAKE) -C build $(MAKECMDGOALS)
	@rm -f *.instance
	@touch $(INSTANCE).instance		# Marker file to display the instance name

plan: $(TF_TARGS) $(dirs)
apply: $(TF_TARGS) $(dirs)
apply-y: $(TF_TARGS) $(dirs)
destroy: $(TF_TARGS) $(dirs)

clean:
	rm -f *.instance
	\rm -Rf node_modules build function.zip

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)