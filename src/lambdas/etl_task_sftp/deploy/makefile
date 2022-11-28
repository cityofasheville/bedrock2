include ../../../make_variables

variable_files = ../../../account.tfvars ../../lambda.tfvars ./local.tfvars
config_files = config.tf datablocks.tf variables.tf local.tfvars
code_files = ../*.py ../requirements.txt

role_key = \"terraform/bedrock/$(INSTANCE)/roles/bedrock-lambda-role/terraform_dev.tfstat\"\\n

terraform.tfvars: $(variable_files) ../../../make_variables
	cat $(variable_files) > terraform.tfvars
	echo rolekey = $(role_key) >> terraform.tfvars
	echo statebucket = \"$(statebucket)\" >> terraform.tfvars

function.zip: $(code_files)
	cp -R $(code_files) .
	rm -Rf ../function.zip ./package
	pip install -r requirements.txt --target ./package
	cd package
	zip -r9 ../function.zip .
	cd ..
	zip -g function.zip ./*.py

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



