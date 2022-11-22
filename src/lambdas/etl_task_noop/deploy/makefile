include ../../../make_variables

variable_files = ../../../account.tfvars ../../lambda.tfvars ./local.tfvars
config_files = config.tf
code_files = ../handler.py

role_key = \"terraform/bedrock/$(BRANCH)/roles/bedrock-lambda-role/terraform_dev.tfstat\"\\n

terraform.tfvars: $(variable_files) ../../../make_variables
	cat $(variable_files) > terraform.tfvars
	echo rolekey = $(role_key) >> terraform.tfvars
	echo statebucket = \"$(statebucket)\" >> terraform.tfvars

function.zip: $(code_files)
	cp -R $(code_files) .
	zip -r9 ./function.zip *.py

.PHONY: init
init: terraform.tfvars
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
	rm -f  terraform.tfvars function.zip



