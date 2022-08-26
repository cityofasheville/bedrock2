include ../../tmp_makefile.branch

variable_files = ../../account.tfvars ../roles.tfvars ./local.tfvars
config_files = config.tf policy_*.json
backends = ../../backend_common.input

backend_key = \"terraform/bedrock/$(BRANCH)/roles/bedrock-lambda-role/terraform_dev.tfstat\"\\n

backend_head = "terraform { \n  backend \"s3\" {"
backend_tail = "  }\n}"

backend.tf: $(backends)
	@echo $(backend_head) > backend.tf
	cat $(backends) >> backend.tf
	@echo key = $(backend_key) >> backend.tf
	@echo $(backend_tail) >> backend.tf

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



