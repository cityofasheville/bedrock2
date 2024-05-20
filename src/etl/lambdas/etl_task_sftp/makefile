include ../../../make_variables

dirs = build
.PHONY: $(dirs) init plan apply destroy prebuild local clean

SRC_DIR := ./deploy
DEST_DIR := ./build
TFFILES := config.tf datablocks.tf backend.tf local.tfvars variables.tf makefile template.yaml

TF_TARGS := $(patsubst %,$(DEST_DIR)/%,$(TFFILES))

code_files = ./*.py ./requirements.txt

prebuild:
	mkdir -p ./build

$(DEST_DIR)/%: $(SRC_DIR)/% ../../../make_variables
ifeq ($(build_mode),sam)
	python3 ../../../scripts/vreplace.py -v codeuri=.. -f ../../../make_variables $< $@
else
	python3 ../../../scripts/vreplace.py -v codeuri=. -f ../../../make_variables $< $@
endif

init: prebuild $(TF_TARGS)
	$(MAKE) -C build $(MAKECMDGOALS)
	@rm -f *.instance
	@touch $(INSTANCE).instance		# Marker file to display the instance name

function.zip: $(code_files)
	rm -Rf ./function.zip ./package
ifeq ($(build_mode),sam)
	sam build --template-file build/template.yaml --use-container
	pushd .aws-sam/build/ftppy; zip -r9q ../../../function.zip . -x \*terraform\*; popd
else
		pip install -r requirements.txt --target ./package
		cd package; zip -r9q ../function.zip . -x \*terraform\*; cd ..
		zip -g function.zip $(code_files)
endif

plan: function.zip $(TF_TARGS) $(dirs)
apply: function.zip $(TF_TARGS) $(dirs)
apply-y: function.zip $(TF_TARGS) $(dirs)
destroy: $(TF_TARGS) $(dirs)

package:
	rm -Rf ./package
	pip3 install -r requirements.txt --target ./package  

local: package
	PYTHONPATH=./package python3 local.py

clean:
	rm -f *.instance
	\rm -Rf build function.zip ./package __pycache__ .aws-sam

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)