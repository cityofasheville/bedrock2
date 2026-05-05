include ../../../make_variables

config_files = config.tf variables.tf
code_files = ../*.js ../*.json

role_key = \"terraform/bedrock/$(INSTANCE)/roles/bedrock-lambda-role/terraform.tfstate\"

terraform.tfvars: ../../../make_variables
	echo region = \"$(region)\" > terraform.tfvars
	echo rolekey = $(role_key) >> terraform.tfvars
	echo statebucket = \"$(statebucket)\" >> terraform.tfvars

layer.zip: $(code_files)
	rm -f layer.zip
	rm -rf nodejs
	mkdir nodejs
	cp $(code_files) nodejs
	cd nodejs; npm install
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
	touch ./layer.zip
	terraform destroy

clean:
	rm -f  terraform.tfvars layer.zip



