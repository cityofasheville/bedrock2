include ../../make_variables

dirs = deploy

.PHONY: $(dirs) init plan apply destroy

init: $(dirs)
	@rm -f BRANCH=*
	@touch BRANCH=$(BRANCH)

plan: $(dirs)
apply: $(dirs)
destroy: $(dirs)

clean: $(dirs)
	rm -f BRANCH=*

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)