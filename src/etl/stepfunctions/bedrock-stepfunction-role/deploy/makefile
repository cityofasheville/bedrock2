include ../../../../make_variables

variable_files = ../../../../account.tfvars ../../stepfunction.tfvars ./local.tfvars
config_files = config.tf policy.json role.json

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

.PHONY: apply-y
apply-y: terraform.tfvars $(config_files)
	terraform apply -auto-approve

.PHONY: destroy itgoaway
destroy: terraform.tfvars $(config_files)
	terraform destroy

itgoaway: destroy
	@echo "All gone!"

clean:
	rm -f  terraform.tfvars backend.tf



