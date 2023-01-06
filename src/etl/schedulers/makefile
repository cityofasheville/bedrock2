include ../../make_variables

dirs = bedrock-eventbridge-role bedrock-cron-scheduler 

.PHONY: $(dirs) init plan apply destroy clean

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(call reverse,$(dirs))
clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)