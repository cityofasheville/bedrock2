include ../../make_variables
include ../make_variables.local

.PHONY: seed

seed:	load_assets.py
	pip install -r ./requirements.txt
	python3 load_assets.py $(DB_ENDPOINT)

clean:
	echo 'Nothing to clean'

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)