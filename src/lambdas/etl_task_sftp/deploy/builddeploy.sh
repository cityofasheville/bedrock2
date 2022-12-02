sam build --use-container

pushd .aws-sam/build/ftppy
zip -r9q ../../../function.zip .
popd

export AWS_PROFILE=custom-terraform

# terraform init
terraform apply -var-file=ca.tfvars -auto-approve
