dirs = bedrock-db bedrock-db-data

.PHONY: $(dirs) init plan apply destroy

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
destroy: $(dirs)
clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)