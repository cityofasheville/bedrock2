include ../make_variables

dirs = lambdas stepfunctions schedulers

.PHONY: $(dirs) test init plan apply destroy

init: $(dirs)
clean: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(call reverse,$(dirs))

plan: 
	@echo 'You must run plan in individual infrastructure type directories: ' $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)
