include ../make_variables

dirs = bedrock_common packages table_copy encrypt

.PHONY: $(dirs) init plan apply destroy clean

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(call reverse,$(dirs))

clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)