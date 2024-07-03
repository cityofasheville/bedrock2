include ../make_variables

dirs = lambdas api-gateways

.PHONY: $(dirs) init plan apply destroy clean local

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(call reverse,$(dirs))
local: lambdas

clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)