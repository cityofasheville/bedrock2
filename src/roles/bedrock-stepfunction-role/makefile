include ../../make_variables

dirs = build

.PHONY: $(dirs) init plan apply destroy prebuild

SRC_DIR := ./deploy
DEST_DIR := ./build
TFFILES := config.tf local.tfvars variables.tf policy.json role.json makefile

TF_TARGS := $(patsubst %,$(DEST_DIR)/%,$(TFFILES))

prebuild:
	mkdir -p ./build

$(DEST_DIR)/%: $(SRC_DIR)/%
	python3 ../../scripts/vreplace.py ../../make_variables $< $@


init: prebuild $(TF_TARGS)
	$(MAKE) -C build $(MAKECMDGOALS)
	@rm -f BRANCH=*
	@touch BRANCH=$(BRANCH)

plan: $(dirs)
apply: $(dirs)
destroy: $(dirs)

clean: $(dirs)
	rm -f BRANCH=*
	\rm -Rf build

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)