include ../../../make_variables

variable_files = ../../../account.tfvars ../../lambda.tfvars ./local.tfvars
config_files = config.tf datablocks.tf variables.tf local.tfvars
code_files = ../*.js ../*.json

role_key = \"terraform/bedrock/$(INSTANCE)/roles/bedrock-lambda-role/terraform.tfstate\"\\n

terraform.tfvars: $(variable_files) ../../../make_variables
	cat $(variable_files) > terraform.tfvars
	echo rolekey = $(role_key) >> terraform.tfvars
	echo statebucket = \"$(statebucket)\" >> terraform.tfvars

function.zip: $(code_files)
	cp -R $(code_files) .
	rm -f ./function.zip
	npm install
	cd node_modules; zip -r9q ../function.zip .; cd ..
	zip -gq function.zip ./*.js

.PHONY: init
init: terraform.tfvars
	terraform init -reconfigure

.PHONY: plan
plan: terraform.tfvars $(config_files) function.zip
	terraform plan

.PHONY: apply
apply: terraform.tfvars $(config_files) function.zip
	terraform apply

.PHONY: apply-y
apply-y: terraform.tfvars $(config_files) function.zip
	terraform apply -auto-approve

.PHONY: destroy
destroy: terraform.tfvars $(config_files)
	terraform destroy

clean:
	rm -f  terraform.tfvars function.zip



