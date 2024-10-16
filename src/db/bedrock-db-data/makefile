dirs = load_assets

.PHONY: $(dirs) init plan apply apply-y destroy db seed

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(dirs)
db: $(dirs)
seed: $(dirs)
clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)