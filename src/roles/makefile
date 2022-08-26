dirs = bedrock-lambda-role

.PHONY: all $(dirs) test
all: $(dirs)

test: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)