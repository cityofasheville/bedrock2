include ../../make_variables

dirs = bedrock-api-lambda-role bedrock-api-backend

.PHONY: $(dirs) init plan apply destroy clean local

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(call reverse,$(dirs))
local: bedrock-api-backend

clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)