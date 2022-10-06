include ../../../make_variables

variable_files = ../../../account.tfvars ../../roles.tfvars ./local.tfvars
config_files = config.tf policy_*.json

backend_key = \"terraform/bedrock/$(BRANCH)/roles/bedrock-lambda-role/terraform_dev.tfstat\"

backend_head = "terraform { \n  backend \"s3\" {\n"
backend_tail = "  }\n}\n"
backends = backend_head backend_tail backend_key

backend.tf: $(backends) $(variable_files)
	@printf $(backend_head) > backend.tf
	@echo region = \"$(region)\" >> backend.tf
	@echo bucket = \"$(statebucket)\" >> backend.tf
	@echo key = $(backend_key) >> backend.tf
	@printf $(backend_tail) >> backend.tf

terraform.tfvars: $(variable_files)
	cat $(variable_files) > terraform.tfvars
	echo branch = \"$(BRANCH)\" >> terraform.tfvars

.PHONY: init
init: backend.tf terraform.tfvars
	terraform init -reconfigure

.PHONY: plan
plan: terraform.tfvars $(config_files)
	terraform plan

.PHONY: apply
apply: terraform.tfvars $(config_files)
	terraform apply

.PHONY: destroy itgoaway
destroy: terraform.tfvars $(config_files)
	terraform destroy

itgoaway: destroy
	@echo "All gone!"

clean:
	rm -f  terraform.tfvars backend.tf



