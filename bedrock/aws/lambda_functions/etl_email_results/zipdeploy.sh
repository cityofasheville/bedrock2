echo "Packaging function as zip..."
rm -f function.zip
pushd node_modules
zip -r9q ../function.zip .
popd
zip -gq function.zip ./*.js ./email.pug
echo "send it"
terraform apply -auto-approve -var-file=ca.tfvars