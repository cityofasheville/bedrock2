
variable_files = ../../account.tfvars ../roles.tfvars

_common.tfvars: $(variable_files)
	cat $(variable_files) > _common.tfvars

clean:
	rm -f  _common.tfvars



