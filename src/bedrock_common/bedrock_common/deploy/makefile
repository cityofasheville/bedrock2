include ../../../make_variables

variable_files = ./local.tfvars
config_files = config.tf variables.tf local.tfvars
code_files = ../*.js ../*.json

role_key = \"terraform/bedrock/$(INSTANCE)/roles/bedrock-lambda-role/terraform.tfstate\"\\n

terraform.tfvars: ../../../make_variables
	cat $(variable_files) > terraform.tfvars
	echo rolekey = $(role_key) >> terraform.tfvars
	echo statebucket = \"$(statebucket)\" >> terraform.tfvars

layer.zip: $(code_files)
	rm -f layer.zip
	rm -rf nodejs
	mkdir nodejs
	mkdir nodejs/node_modules
	mkdir nodejs/node_modules/bedrock_common 	# include bedrock_common as package
	cp $(code_files) nodejs/node_modules/bedrock_common
	zip -rq layer.zip nodejs/

.PHONY: init
init: terraform.tfvars
	terraform init -reconfigure

.PHONY: plan
plan: terraform.tfvars $(config_files) layer.zip
	terraform plan

.PHONY: apply
apply: terraform.tfvars $(config_files) layer.zip
	terraform apply

.PHONY: apply-y
apply-y: terraform.tfvars $(config_files) layer.zip
	terraform apply -auto-approve

.PHONY: destroy
destroy: terraform.tfvars $(config_files)
	terraform destroy

clean:
	rm -f  terraform.tfvars layer.zip



