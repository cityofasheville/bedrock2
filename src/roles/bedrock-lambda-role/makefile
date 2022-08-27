include ../../make_variables

variable_files = ../../account.tfvars ../roles.tfvars ./local.tfvars
config_files = config.tf policy_*.json

backend_key = \"terraform/bedrock/$(BRANCH)/roles/bedrock-lambda-role/terraform_dev.tfstat\"\\n

backend_head = "terraform { \n  backend \"s3\" {"
backend_tail = "  }\n}"

backend.tf: $(backends)
	@echo $(backend_head) > backend.tf
	@echo region = \"$(region)\" >> backend.tf
	@echo bucket = \"$(statebucket)\" >> backend.tf
	@echo key = $(backend_key) >> backend.tf
	@echo $(backend_tail) >> backend.tf

terraform.tfvars: $(variable_files)
	cat $(variable_files) > terraform.tfvars

.PHONY: init
init: backend.tf terraform.tfvars
	terraform init -reconfigure

.PHONY: plan
plan: terraform.tfvars $(config_files)
	terraform plan

.PHONY: apply
apply: terraform.tfvars $(config_files)
	terraform apply

.PHONY: destroy
destroy: terraform.tfvars $(config_files)
	terraform destroy

clean:
	rm -f  terraform.tfvars backend.tf



