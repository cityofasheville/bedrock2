include ../../../../make_variables

variable_files = ../../../../account.tfvars ../../stepfunction.tfvars ./local.tfvars
config_files = config.tf datablocks.tf variables.tf states.json local.tfvars


terraform.tfvars: $(variable_files) ../../../../make_variables
	cat $(variable_files) > terraform.tfvars
	echo statebucket = \"$(statebucket)\" >> terraform.tfvars

.PHONY: init
init: terraform.tfvars
	terraform init -reconfigure

.PHONY: plan
plan: terraform.tfvars $(config_files)
	terraform plan

.PHONY: apply
apply: terraform.tfvars $(config_files)
	terraform apply
	echo STATE_MACHINE_ARN=`terraform output -json process_etl_run_group_arn` > ../state_machine_variables.generated

.PHONY: apply-y
apply-y: terraform.tfvars $(config_files)
	terraform apply -auto-approve
	echo STATE_MACHINE_ARN=`terraform output -json process_etl_run_group_arn` > ../state_machine_variables.generated

.PHONY: destroy
destroy: terraform.tfvars $(config_files)
	terraform destroy

clean:
	rm -f  terraform.tfvars



