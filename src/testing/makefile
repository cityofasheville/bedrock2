dirs = bedrock-db bedrock-db-data

.PHONY: $(dirs) init plan apply apply-y destroy db seed

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(dirs)
db: $(dirs)
seed: $(dirs)
clean: $(dirs)
	rm make_variables.generated

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)