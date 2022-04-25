echo "Packaging function as zip..."
rm -f function.zip
pushd node_modules
zip -r9q ../function.zip .
popd
zip -gq function.zip ./*.js
echo "send it"
terraform apply -var-file=ca.tfvars
# terraform apply -auto-approve -var-file=ca.tfvars