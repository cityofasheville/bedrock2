include ../../make_variables

dirs = bedrock-stepfunction-role process_etl_run_group

.PHONY: $(dirs) init plan apply destroy

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(call reverse,$(dirs))
clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)