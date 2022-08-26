dirs = roles lambdas

.PHONY: $(dirs) test init plan apply destroy

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
destroy: $(dirs)
clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)