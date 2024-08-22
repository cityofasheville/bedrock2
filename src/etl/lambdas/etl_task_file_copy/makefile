include ../../../make_variables

dirs = build
.PHONY: $(dirs) init plan apply destroy prebuild local clean test

SRC_DIR := ./deploy
DEST_DIR := ./build
TFFILES := config.tf datablocks.tf backend.tf local.tfvars variables.tf makefile

TF_TARGS := $(patsubst %,$(DEST_DIR)/%,$(TFFILES))

code_files = ./*.py ./requirements.txt

prebuild:
	mkdir -p ./build

$(DEST_DIR)/%: $(SRC_DIR)/% ../../../make_variables
	python3 ../../../scripts/vreplace.py -f ../../../make_variables $< $@

init: prebuild $(TF_TARGS)
	$(MAKE) -C build $(MAKECMDGOALS)
	@rm -f *.instance
	@touch $(INSTANCE).instance		# Marker file to display the instance name

function.zip: $(code_files)
	rm -f ./function.zip
	zip -r9q function.zip $(code_files)

plan: function.zip $(TF_TARGS) $(dirs)
apply: function.zip $(TF_TARGS) $(dirs)
apply-y: function.zip $(TF_TARGS) $(dirs)
destroy: $(TF_TARGS) $(dirs)

requirements.txt: ../../../bedrock_common/packages_py/requirements.txt
	cp ../../../bedrock_common/packages_py/requirements.txt .

package: requirements.txt
	rm -Rf ./package
	pip3 install -r requirements.txt --target ./package  

local: package
	PYTHONPATH=./package python3 local.py

run: package # To use: "make run run=somepythonfile.py"
	PYTHONPATH=./package python3 $(run)

clean:
	rm -f *.instance
	\rm -Rf build function.zip ./package __pycache__ .aws-sam requirements.txt

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)
