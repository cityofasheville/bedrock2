
variable_files = ../../account.tfvars ../roles.tfvars ./local.tfvars
config_files = config.tf policy_*.json
backends = ../../backend_common.input ./backend_local.input

backend.tf: $(backends)
	@echo "terraform { \n  backend \"s3\" {" >> backend.tf
	cat $(backends) >> backend.tf
	@echo "  }\n}" >> backend.tf

terraform.tfvars: $(variable_files)
	cat $(variable_files) > terraform.tfvars

.PHONY: init
init: backend.tf
	terraform init -reconfigure

.PHONY: plan
plan: terraform.tfvars $(config_files)
	terraform plan

.PHONY: apply
apply: terraform.tfvars $(config_files)
	terraform apply

clean:
	rm -f  terraform.tfvars backend.tf



