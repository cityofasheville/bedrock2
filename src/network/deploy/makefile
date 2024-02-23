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
	terraform output > ../networkvariables.generated

.PHONY: apply-y
apply-y: terraform.tfvars $(config_files)
	terraform apply -auto-approve
	terraform output > ../networkvariables.generated

.PHONY: destroy itgoaway
destroy: terraform.tfvars $(config_files)
	terraform destroy

itgoaway: destroy
	@echo "All gone!"

clean:
	rm -f  terraform.tfvars backend.tf



