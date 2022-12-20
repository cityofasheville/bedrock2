dirs = roles lambdas stepfunctions

.PHONY: $(dirs) test init plan apply destroy

init: $(dirs)
clean: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(dirs)

plan: 
	@echo 'You must run plan in individual infrastructure type directories: ' $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)