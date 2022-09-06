include ../../../make_variables

variable_files = ../../../account.tfvars ../../lambda.tfvars ./local.tfvars
config_files = config.tf
code_files = ../handler.py

backend_key = \"terraform/bedrock/$(BRANCH)/lambdas/etl_task_noop/terraform_dev.tfstat\"\\n

backend_head = "terraform { \n  backend \"s3\" {"
backend_tail = "  }\n}"

role_key = \"terraform/bedrock/$(BRANCH)/roles/bedrock-lambda-role/terraform_dev.tfstat\"\\n

backend.tf: $(backends)
	@echo $(backend_head) > backend.tf
	@echo region = \"$(region)\" >> backend.tf
	@echo bucket = \"$(statebucket)\" >> backend.tf
	@echo key = $(backend_key) >> backend.tf
	@echo $(backend_tail) >> backend.tf

terraform.tfvars: $(variable_files) ../../../make_variables
	cat $(variable_files) > terraform.tfvars
	echo rolekey = $(role_key) >> terraform.tfvars
	echo statebucket = \"$(statebucket)\" >> terraform.tfvars

function.zip: $(code_files)
	cp -R $(code_files) .
	zip -r9 ./function.zip *.py

.PHONY: init
init: backend.tf terraform.tfvars
	terraform init -reconfigure

.PHONY: plan
plan: terraform.tfvars $(config_files) function.zip
	terraform plan

.PHONY: apply
apply: terraform.tfvars $(config_files) function.zip
	terraform apply

.PHONY: destroy
destroy: terraform.tfvars $(config_files)
	terraform destroy

clean:
	rm -f  terraform.tfvars backend.tf function.zip



