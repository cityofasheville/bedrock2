dirs = process_etl_run_group

.PHONY: $(dirs) init plan apply destroy

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(dirs)
clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)