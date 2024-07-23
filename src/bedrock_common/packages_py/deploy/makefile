include ../../../make_variables

variable_files = ./local.tfvars
config_files = config.tf variables.tf local.tfvars

role_key = \"terraform/bedrock/$(INSTANCE)/roles/bedrock-lambda-role/terraform.tfstate\"\\n

terraform.tfvars: ../../../make_variables
	cat $(variable_files) > terraform.tfvars
	echo rolekey = $(role_key) >> terraform.tfvars
	echo statebucket = \"$(statebucket)\" >> terraform.tfvars

layer.zip: ../requirements.txt
	rm -Rf ./layer.zip ./package
ifeq ($(build_mode),sam)
	sam build --template-file template.yaml --use-container
	pushd .aws-sam/build; zip -r9q ../../layer.zip ./python -x \*terraform\*; popd
else
	pip3 install -r ../requirements.txt --target ./package
	cd package; zip -r9q ../layer.zip . -x \*terraform\*; cd ..
endif

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



