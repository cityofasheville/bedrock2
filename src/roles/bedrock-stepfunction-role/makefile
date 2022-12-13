include ../../make_variables

dirs = build

.PHONY: $(dirs) init plan apply destroy prebuild

SRC_DIR := ./deploy
DEST_DIR := ./build
TFFILES := config.tf backend.tf local.tfvars variables.tf policy.json role.json makefile

TF_TARGS := $(patsubst %,$(DEST_DIR)/%,$(TFFILES))

prebuild:
	mkdir -p ./build

$(DEST_DIR)/%: $(SRC_DIR)/%
	python3 ../../scripts/vreplace.py -f ../../make_variables $< $@


init: prebuild $(TF_TARGS)
	$(MAKE) -C build $(MAKECMDGOALS)
	@rm -f *.instance
	@touch $(INSTANCE).instance		# Marker file to display the instance name
	
plan: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(dirs)

clean:
	rm -f *.instance
	\rm -Rf build

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)