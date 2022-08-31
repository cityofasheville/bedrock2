include ../../make_variables

dirs = deploy

.PHONY: $(dirs) init plan apply destroy

#https://stackoverflow.com/questions/42661248/gnu-make-how-to-copy-files-from-source-to-destination

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