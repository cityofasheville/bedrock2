include ../../make_variables

variable_files = ../../account.tfvars ./local.tfvars
config_files = config.tf

terraform.tfvars: $(variable_files)
	cat $(variable_files) > terraform.tfvars

.PHONY: init
init: terraform.tfvars
	terraform init -reconfigure

.PHONY: plan
plan: terraform.tfvars $(config_files)
	terraform plan

.PHONY: apply
apply: terraform.tfvars $(config_files)
	terraform apply
	echo BEDROCK_VPC_ID=`terraform output -json BEDROCK_VPC_ID` >> ../bedrock_network_variables.generated
	echo DB_SUBNET_GROUP_NAME=`terraform output -json DB_SUBNET_GROUP_NAME` >> ../bedrock_network_variables.generated
	echo BEDROCK_SECURITY_GROUP_IDS=`terraform output -json BEDROCK_SECURITY_GROUP_IDS` >> ../bedrock_network_variables.generated
	echo BEDROCK_PRIVATE_SUBNETS=`terraform output -json BEDROCK_PRIVATE_SUBNETS` > ../bedrock_network_variables.generated

.PHONY: apply-y
apply-y: terraform.tfvars $(config_files)
	terraform apply -auto-approve
	echo BEDROCK_VPC_ID=`terraform output -json BEDROCK_VPC_ID` >> ../bedrock_network_variables.generated
	echo DB_SUBNET_GROUP_NAME=`terraform output -json DB_SUBNET_GROUP_NAME` >> ../bedrock_network_variables.generated
	echo BEDROCK_SECURITY_GROUP_IDS=`terraform output -json BEDROCK_SECURITY_GROUP_IDS` >> ../bedrock_network_variables.generated
	echo BEDROCK_PRIVATE_SUBNETS=`terraform output -json BEDROCK_PRIVATE_SUBNETS` > ../bedrock_network_variables.generated

.PHONY: destroy itgoaway
destroy: terraform.tfvars $(config_files)
	terraform destroy

itgoaway: destroy
	@echo "All gone!"

clean:
	rm -f  terraform.tfvars backend.tf



