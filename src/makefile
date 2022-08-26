dirs = roles lambdas

.PHONY: test $(dirs) test init plan apply destroy

test: $(dirs)
init: $(dirs)
plan: $(dirs)
apply: $(dirs)
destroy: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)