dirs = bedrock-lambda-role bedrock-stepfunction-role

.PHONY: $(dirs) init plan apply destroy

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(dirs)
clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)