dirs = roles lambdas stepfunctions

.PHONY: $(dirs) test init plan apply destroy

init: $(dirs)
clean: $(dirs)

plan: 
	@echo 'You must run plan in individual infrastructure type directories: ' $(dirs)

apply: 
	@echo 'You must run apply in individual infrastructure type directories: ' $(dirs)

destroy: 
	@echo 'You must run destroy in individual infrastructure type directories: ' $(dirs)	


$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)