include ../../../make_variables
-include ../../make_variables.generated

.PHONY: seed init plan apply apply-y destroy db seed

seed:	load_assets.py
	pip install -r ./requirements.txt
	python3 load_assets.py $(BEDROCK_DB_HOST_ENDPOINT)

clean:
	echo 'Nothing to clean'

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)